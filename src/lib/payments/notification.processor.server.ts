import { adminDb } from "@/lib/firebase/admin-config";
import { logger } from "@/lib/logger";
import { updateOrderStatus } from "@/domains/orders/services.server";
import { updateSubscription } from "@/domains/subscriptions/services.server";
import { createAuditLog } from "@/lib/services/audit";
import { createHmac } from "crypto";

export interface ProcessingResult {
    received: boolean;
    idempotency_hit?: boolean;
    definitiveStatus?: string;
    orderId?: string;
    subscriptionUpdated?: boolean;
    error?: string;
    ignored?: string;
}

/**
 * The Central Brain for all payment notifications (Webhooks & IPN).
 * Handles signature validation, idempotency, backend-to-backend verification,
 * and atomic state transitions for both Orders and Subscriptions.
 */
export async function processMercadoPagoNotification(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
): Promise<ProcessingResult> {
    const requestId = crypto.randomUUID();
    const eventIdSource = headers["x-request-id"] || headers["x-request-id"]?.[0] || requestId;

    try {
        // --- 1. Signature Validation ---
        const secret = process.env.MP_WEBHOOK_SECRET || process.env.MERCADOPAGO_WEBHOOK_SECRET;
        const xSignature = headers["x-signature"] as string;
        const xRequestId = headers["x-request-id"] as string;

        if (secret && xSignature && xRequestId) {
            const parts = Object.fromEntries(
                xSignature.split(",").map(p => p.split("=") as [string, string])
            );
            
            if (parts.ts && parts.v1) {
                const communitiesToSign = `id:${xRequestId};request-date:${parts.ts};`;
                const expectedSig = createHmac("sha256", secret).update(communitiesToSign).digest("hex");
                
                if (parts.v1 !== expectedSig) {
                    logger.error("[NotificationProcessor] Invalid signature", { requestId, xRequestId });
                    return { received: false, error: "Invalid signature" };
                }
            }
        }

        // --- 2. Parse Payload ---
        const payload = JSON.parse(rawBody);
        
        // MP sends 'topic' for IPN and 'type' or 'action' for Webhooks
        const type = payload.type || payload.topic;
        const action = payload.action;

        // We only care about payments
        if (type !== "payment" && action !== "payment.created" && action !== "payment.updated") {
            return { received: true, ignored: "Not a payment event" };
        }

        const paymentId = payload.data?.id || payload.id;
        if (!paymentId) {
            return { received: true, ignored: "No payment data ID" };
        }

        // --- 3. Idempotency Check & Logging Attempt ---
        const dedupId = `mp_ev_${paymentId}_${requestId.split('-')[0]}`; // Safe dedup
        const eventRef = adminDb.collection("webhook_events").doc(dedupId);
        
        const isProcessed = await adminDb.runTransaction(async (tx) => {
            const snap = await tx.get(eventRef);
            if (snap.exists) return true;
            
            tx.set(eventRef, {
                provider: "mercadopago",
                paymentId,
                payload,
                processedAt: Date.now(),
                requestId
            });
            return false;
        });

        if (isProcessed) {
            return { received: true, idempotency_hit: true };
        }

        // Audit Attempt
        await createAuditLog({
            storeId: "HQ_PLATFORM", // Default for system-level notifications
            actorId: "mercadopago_system",
            action: "PAYMENT_NOTIFICATION_RECEIVED",
            entityType: "payment",
            entityId: paymentId.toString(),
            metadata: { type, action, requestId }
        });

        // --- 4. Backend-to-Backend Validation (Absolute Truth) ---
        // We need to find the intent first to know which store/tenant this belongs to (for tokens)
        let intentQuery = await adminDb.collection("payment_intents")
            .where("providerTransactionId", "==", paymentId.toString())
            .limit(1)
            .get();

        // Fallback: search by ID if payload sends internal_reference (common in preferences)
        let intentDoc = intentQuery.docs[0];
        if (!intentDoc && payload.data?.external_reference) {
            const refDoc = await adminDb.collection("payment_intents").doc(payload.data.external_reference).get();
            if (refDoc.exists) intentDoc = refDoc as any;
        }

        if (!intentDoc) {
             logger.warn("[NotificationProcessor] Payment intent not found locally", { paymentId });
             return { received: true, definitiveStatus: "not_found" };
        }

        const intentData = intentDoc.data();
        const storeId = intentData.storeId || "HQ_PLATFORM";
        
        // Fetch Token (HQ vs Tenant)
        let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (storeId !== "HQ_PLATFORM") {
            const storeInteg = await adminDb.doc(`stores/${storeId}/integrations/mercadopago`).get();
            if (storeInteg.exists) accessToken = storeInteg.data()?.accessToken;
        } else {
            const hqInteg = await adminDb.doc(`system/config/integrations/mercadopago`).get();
            if (hqInteg.exists) accessToken = hqInteg.data()?.accessToken;
        }

        // Official Fetch from MP API
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!mpRes.ok) {
            const errBody = await mpRes.text();
            logger.error("[NotificationProcessor] Failed API verification", { paymentId, status: mpRes.status, errBody });
            throw new Error(`MP API Verification failed: ${mpRes.status}`);
        }

        const mpData = await mpRes.json();
        const definitiveStatus = mpData.status; // 'approved', 'rejected', etc.
        const amount = mpData.transaction_amount;

        // --- 5. Atomic Dispatcher (Lifecycle Management) ---
        const isApproved = definitiveStatus === "approved";
        
        // Determine if it's a Subscription or an Order
        // Subscriptions usually have metadata like { type: 'subscription' }
        const isSubscription = mpData.metadata?.type === "subscription" || intentData.metadata?.type === "subscription";

        if (isApproved) {
            if (isSubscription) {
                // HANDLE SUBSCRIPTION UPGRADE
                const tenantId = mpData.metadata?.tenantId || intentData.storeId;
                const newPlanId = mpData.metadata?.planId || intentData.metadata?.planId;
                
                await updateSubscription(tenantId, {
                    planId: newPlanId,
                    status: "active",
                    currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000
                });

                // Update store level plan
                await adminDb.collection("stores").doc(tenantId).update({
                    planId: newPlanId,
                    subscriptionStatus: "active",
                    updatedAt: Date.now()
                });

                await createAuditLog({
                    storeId: tenantId,
                    actorId: "system_billing",
                    action: "PLAN_UPGRADE_COMPLETE",
                    entityType: "subscription",
                    entityId: tenantId,
                    metadata: { planId: newPlanId, paymentId }
                });

                return { received: true, definitiveStatus, subscriptionUpdated: true };
            } else {
                // HANDLE ORDER PAYMENT
                const orderId = intentData.orderId;
                if (orderId && intentData.status !== "SUCCEEDED" && intentData.status !== "PAID") {
                    await intentDoc.ref.update({
                        status: "SUCCEEDED",
                        providerTransactionId: paymentId.toString(),
                        updatedAt: Date.now()
                    });

                    await updateOrderStatus(orderId, storeId, "PAID", "mp_processor");
                    
                    await createAuditLog({
                        storeId,
                        actorId: "system_payments",
                        action: "ORDER_PAID",
                        entityType: "order",
                        entityId: orderId,
                        metadata: { paymentId, amount }
                    });

                    return { received: true, definitiveStatus, orderId };
                }
            }
        } else if (definitiveStatus === "rejected" || definitiveStatus === "cancelled") {
             await intentDoc.ref.update({
                status: "FAILED",
                updatedAt: Date.now()
            });
            // Orders usually stay open or go to CANCELLED depending on business rules.
            // For now, we just mark the intent as failed.
        }

        return { received: true, definitiveStatus };

    } catch (err: any) {
        logger.error("[NotificationProcessor] Critical error", { requestId, error: err.message });
        return { received: false, error: err.message };
    }
}

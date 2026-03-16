import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { logger } from "@/lib/logger";
import { updateOrderStatus } from "@/domains/orders/services.server";
import { createHmac } from "crypto";

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    try {
        const rawBody = await req.text();
        const headers = Object.fromEntries(req.headers.entries());
        
        // --- 1. Signature Validation (Integrity) ---
        const secret = process.env.MP_WEBHOOK_SECRET || process.env.MERCADOPAGO_WEBHOOK_SECRET;
        const xSignature = headers["x-signature"];
        const xRequestId = headers["x-request-id"];

        if (secret && xSignature && xRequestId) {
            // "ts=...,v1=..."
            const parts = Object.fromEntries(
                xSignature.split(",").map(p => p.split("=") as [string, string])
            );
            
            if (parts.ts && parts.v1) {
                const toSign = `id:${xRequestId};request-date:${parts.ts};`;
                const expected = createHmac("sha256", secret).update(toSign).digest("hex");
                
                if (parts.v1 !== expected) {
                    logger.error("MercadoPago webhook invalid signature", { requestId });
                    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
                }
            }
        }

        // --- 2. Parse Payload ---
        const payload = JSON.parse(rawBody);

        logger.info("MercadoPago webhook received", {
            requestId,
            action: payload?.action || payload?.type,
            eventId: payload?.id
        });

        // MP sends multiple types; we only care about 'payment' 
        if (payload.type !== "payment" && payload.action !== "payment.created" && payload.action !== "payment.updated") {
            return NextResponse.json({ received: true, ignored: "Not a payment event" });
        }

        const paymentId = payload.data?.id;
        if (!paymentId) {
            return NextResponse.json({ received: true, ignored: "No payment data ID" });
        }

        // --- 3. Idempotency Check ---
        // We use a dedicated collection 'webhook_events' to ensure we process MP event IDs only once.
        const eventId = payload.id ? `mp_${payload.id}` : `mp_pay_${paymentId}_${Date.now()}`;
        const eventRef = adminDb.collection("webhook_events").doc(eventId);
        
        const isAlreadyProcessed = await adminDb.runTransaction(async (tx) => {
            const snap = await tx.get(eventRef);
            if (snap.exists) return true; // Already processed
            
            tx.set(eventRef, {
                provider: "mercadopago",
                paymentId,
                payload,
                processedAt: Date.now()
            });
            return false;
        });

        if (isAlreadyProcessed) {
            logger.info("MercadoPago webhook ignored (Idempotency hit)", { requestId, eventId });
            return NextResponse.json({ received: true, idempotency_hit: true });
        }

        // --- 4. Fetch the absolute truth from MP APIs (Optional but recommended, relying on payload for now to support dynamic tenants) ---
        // Because tenants have their own credentials, we extract the metadata from the payload directly.
        // In a strictly secure app, we'd GET /v1/payments/{paymentId} using the specific tenant's Access Token.
        // However, we just safely rely on the signed payload or we'd need the storeId to lookup the tenant's MP_TOKEN.
        
        const isApproved = false; // We check this below:
        
        // If it's a direct notification (sandbox testing sometimes sends straight objects vs API notifications)
        let status = payload.data?.status;
        let intentId = payload.data?.external_reference;
        
        // Real MP webhooks usually require fetching the payment object again to get status/external_reference
        // Let's do a fast-path lookup if we can figure out the storeId/intentId.
        // If `status` and `external_reference` aren't embedded in `payload.data` 
        // we'd fetch it from MP, but we don't have the tenant's token handy without `storeId`.
        // Let's assume standard MP webhooks send `status` in `payload.data` OR we fetch using global token
        // Wait, the client token might be dynamic (OAuth Marketplace). So we'll search our local intents database first using `provider_intent_id`.
        
        let localIntentSnap = await adminDb.collection("payment_intents")
            .where("provider_intent_id", "==", paymentId.toString())
            .limit(1)
            .get();
            
        // If not found by provider_intent_id, try by external_reference (from Brick creation it might be the document ID itself)
        if (localIntentSnap.empty && intentId) {
            const docRef = await adminDb.collection("payment_intents").doc(intentId).get();
            if (docRef.exists) {
                // Mock a snapshot array structure for the code below
                localIntentSnap = { empty: false, docs: [docRef] } as any;
            }
        }
            
        if (localIntentSnap.empty) {
             logger.warn("MercadoPago webhook payment not found locally", { paymentId, intentId });
             // We still return 200 so MP stops retrying for unlinked Sandbox noise
             return NextResponse.json({ received: true, mapped: false });
        }

        const intentDoc = localIntentSnap.docs[0];
        const intentData = intentDoc.data();
        const storeId = intentData.storeId || intentData.store_id;
        const orderId = intentData.orderId || intentData.order_id;
        
        // To be completely secure and prevent payload spoofing across tenants, 
        // we MUST verify the payment strictly against MP APIs using the Tenant's token.
        const tenantIntegrationParams = await adminDb.collection("stores").doc(storeId)
                                               .collection("integrations").doc("mercadopago").get();
                                               
        const tenantToken = tenantIntegrationParams.exists 
            ? tenantIntegrationParams.data()?.accessToken 
            : (process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN);

        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${tenantToken}` }
        });
        
        if (!mpRes.ok) {
            logger.error("Failed to query MP Payment details", { paymentId, status: mpRes.status });
            throw new Error(`Failed to query MP Payment details: ${mpRes.status}`);
        }
        
        const mpPaymentData = await mpRes.json();
        const definitiveStatus = mpPaymentData.status;

        // --- 5. State Transition & Order Update ---
        if (definitiveStatus === "approved" && intentData.status !== "SUCCEEDED" && intentData.status !== "PAID") {
            const newIntentStatus = "PAID"; // Matches the system standards
            
            await intentDoc.ref.update({
                status: newIntentStatus,
                updatedAt: Date.now(),
                providerTransactionId: paymentId.toString()
            });

            // Update associated Order status (atomically applies inventory deductions inside)
            if (orderId) {
                await updateOrderStatus(orderId, storeId, "PAID", "mp_webhook");
                logger.info(`Order ${orderId} marked as PAID via MP Webhook`);
            }
        } else if (definitiveStatus === "rejected" || definitiveStatus === "cancelled") {
            await intentDoc.ref.update({
                status: "FAILED",
                updatedAt: Date.now()
            });
        }

        return NextResponse.json({ received: true, definitiveStatus, orderId });
    } catch (err: any) {
         logger.error("MercadoPago webhook processing failed", {
             requestId,
             error: err.message
         });
         return NextResponse.json({ error: "Webhook Server Error" }, { status: 500 });
    }
}

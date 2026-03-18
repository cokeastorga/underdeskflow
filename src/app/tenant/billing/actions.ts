"use server";

import { adminDb } from "@/lib/firebase/admin-config";
import { PlanId } from "@/types/billing";
import { revalidatePath } from "next/cache";
import { PLANS } from "@/lib/billing/plans";
import { MercadoPagoAdapter } from "@/lib/payments/adapters/mercadopago.adapter";
import { PaymentIntent } from "@/types/payments";
import { randomUUID } from "crypto";

export async function upgradePlanAction(storeId: string, userId: string, newPlanId: PlanId) {
    if (!storeId || !userId || !newPlanId) {
        throw new Error("Missing required fields for upgrade");
    }

    const plan = PLANS.find(p => p.id === newPlanId);
    if (!plan) throw new Error("Plan no encontrado");

    // --- CASE 1: PAID PLAN (PRO / ENTERPRISE) ---
    // If the plan is paid, we DO NOT update the DB yet. 
    // We create a PaymentIntent and return a checkout URL.
    if (plan.priceMonthly > 0) {
        try {
            const adapter = new MercadoPagoAdapter();
            const intentId = `sub_${randomUUID()}`;
            
            const intent: PaymentIntent = {
                id: intentId,
                store_id: "HQ_PLATFORM", // Revenue goes to Jorge's HQ account
                order_id: `subscription_${storeId}`,
                idempotency_key: intentId,
                amount: plan.priceMonthly,
                currency: "CLP",
                country: "CL",
                payment_method: "card", // Use authorized type from PaymentMethod
                provider: "mercadopago",
                provider_intent_id: null,
                status: "PENDING",
                client_url: null,
                client_secret: null,
                expires_at: Date.now() + 30 * 60 * 1000,
                metadata: {
                    type: "subscription",
                    tenantId: storeId,
                    planId: newPlanId,
                    userId: userId
                },
                created_at: Date.now(),
                updated_at: Date.now(),
                version: 1,
                refunded_amount: 0,
                refund_count: 0,
                connect_account_id: null,
                platform_fee_amount: null,
                commission: null
            };

            // Save the intent for the webhook to find it later
            await adminDb.collection("payment_intents").doc(intentId).set(intent);

            const result = await adapter.createPayment(intent);
            
            if (!result.client_url) {
                throw new Error("No se pudo generar el link de pago de Mercado Pago");
            }

            return { success: true, checkoutUrl: result.client_url };
        } catch (error: any) {
            console.error("Error creating subscription intent:", error);
            throw new Error("Error al iniciar el proceso de suscripción: " + (error.message || "Unknown error"));
        }
    }

    // --- CASE 2: FREE PLAN (BASIC) ---
    // Immediate conversion.
    try {
        await adminDb.runTransaction(async (transaction) => {
            const storeRef = adminDb.collection("stores").doc(storeId);
            const subRef = adminDb.collection("subscriptions").doc(storeId);

            transaction.update(storeRef, {
                planId: newPlanId,
                subscriptionStatus: "active",
                updatedAt: Date.now()
            });

            transaction.set(subRef, {
                planId: newPlanId,
                status: "active",
                updatedAt: Date.now(),
                currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
                cancelAtPeriodEnd: false
            }, { merge: true });

            const logRef = adminDb.collection("audit_logs").doc();
            transaction.set(logRef, {
                userId,
                storeId,
                action: "PLAN_UPGRADE_FREE",
                details: { newPlanId },
                timestamp: Date.now()
            });
        });

        revalidatePath("/tenant/billing");
        return { success: true };
    } catch (error: any) {
        console.error("Plan upgrade transaction failed:", error);
        throw new Error("No se pudo procesar la actualización del plan.");
    }
}

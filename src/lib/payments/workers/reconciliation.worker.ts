import {
    findStaleIntents,
    findPendingRefunds,
    saveRefund,
    findIntentById
} from "@/lib/payments/repository";
import { paymentOrchestrator } from "@/lib/payments/orchestrator";
import { adapterRegistry } from "@/lib/payments/registry";
import {
    PaymentIntent,
    Refund,
    PaymentStatus,
    RefundStatus
} from "@/types/payments";

/**
 * Reconciliation Worker — Ensures eventual consistency across all PSPs.
 */

const INTENT_TIMEOUT_MS = parseInt(process.env.RECONCILE_INTENT_TIMEOUT_MIN || "30") * 60 * 1000;
const REFUND_TIMEOUT_MS = parseInt(process.env.RECONCILE_REFUND_TIMEOUT_MIN || "60") * 60 * 1000;

export async function runReconciliationWorker() {
    console.log("[Reconcile] Starting reconciliation run...");

    await Promise.allSettled([
        reconcileStaleIntents(),
        reconcilePendingRefunds()
    ]);

    console.log("[Reconcile] Reconciliation run finished.");
}

async function reconcileStaleIntents() {
    const staleIntents = await findStaleIntents(INTENT_TIMEOUT_MS);
    for (const intent of staleIntents) {
        try {
            if (!intent.provider_intent_id) continue;

            const adapter = adapterRegistry.get(intent.provider);
            const result = await adapter.queryStatus(intent.provider_intent_id);

            if (result.status !== intent.status) {
                console.info(`[Reconcile] Intent ${intent.id} transitioned ${intent.status} -> ${result.status}. Syncing...`);

                await paymentOrchestrator.syncIntentStatus(intent.id, {
                    provider_event_id: `reconcile-${Date.now()}`,
                    provider_intent_id: intent.provider_intent_id,
                    raw_status: (result.raw as any)?.status || "unknown",
                    normalized_status: result.status,
                    amount: result.amount,
                    currency: result.currency,
                    metadata: (result.raw as any)?.metadata || {},
                    occurred_at: new Date()
                }, "system");
            }
        } catch (err) {
            console.error(`[Reconcile] Failed to reconcile intent ${intent.id}:`, err);
        }
    }
}

async function reconcilePendingRefunds() {
    const pendingRefunds = await findPendingRefunds(REFUND_TIMEOUT_MS);
    for (const refund of pendingRefunds) {
        try {
            if (!refund.provider_refund_id) continue;

            const intent = await findIntentById(refund.payment_intent_id);
            if (!intent) continue;

            const adapter = adapterRegistry.get(intent.provider);
            const result = await adapter.queryRefundStatus(refund.provider_refund_id);

            if (result.status !== "PENDING") {
                console.info(`[Reconcile] Refund ${refund.id} transitioned PENDING -> ${result.status}. Finalizing...`);

                if (result.status === "SUCCEEDED") {
                    await paymentOrchestrator.finalizeRefund(intent, refund);
                } else if (result.status === "FAILED" || result.status === "CANCELED") {
                    await saveRefund({
                        ...refund,
                        status: result.status,
                        updated_at: Date.now()
                    });
                }
            }
        } catch (err) {
            console.error(`[Reconcile] Failed to reconcile refund ${refund.id}:`, err);
        }
    }
}

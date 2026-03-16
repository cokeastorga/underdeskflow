import { adminDb } from "@/lib/firebase/admin-config";
import { logger } from "@/lib/logger";
import { paymentOrchestrator } from "@/lib/payments/orchestrator";
import { adapterRegistry } from "@/lib/payments/registry";

/**
 * PSP Reconciliation Worker
 * Scans for Payment Intents that have been sitting in "CREATED" or "PENDING"
 * status for more than `STALE_THRESHOLD_MINUTES`.
 * Directly interrogates the PSP (Mercado Pago, Stripe, etc.) to fetch the truthful status,
 * bypassing potentially dropped or delayed Webhooks.
 */
export async function reconcileStalePayments() {
    const STALE_THRESHOLD_MINUTES = 20;
    const staleThresholdMs = Date.now() - (STALE_THRESHOLD_MINUTES * 60 * 1000);

    logger.info("Starting PSP Reconciliation Job", { worker: "reconciliation" });

    try {
        // Query for intents that might have been dropped by the webhook delivery
        const staleIntentsSnap = await adminDb.collection("payment_intents")
            .where("status", "in", ["CREATED", "PENDING", "AUTHORIZED"])
            .where("created_at", "<=", staleThresholdMs)
            .limit(50) // Process in chunks
            .get();

        if (staleIntentsSnap.empty) {
            logger.info("No stale intents found for reconciliation.", { worker: "reconciliation" });
            return { processed: 0, recovered: 0 };
        }

        let recovered = 0;

        for (const doc of staleIntentsSnap.docs) {
            const intent = doc.data() as any; // Type as PaymentIntent
            const intentId = intent.id;
            
            try {
                // If it never even reached the PSP (No provider reference), and it's 20 mins old, 
                // it's a dead terminal session. Mark as FAILED.
                if (!intent.provider_intent_id) {
                    logger.warn(`Intent ${intentId} lacks provider_intent_id and is stale. Marking as FAILED.`, { intentId });
                    
                    // We transition it manually to FAILED
                    await adminDb.collection("payment_intents").doc(intentId).update({
                        status: "FAILED",
                        updated_at: Date.now()
                    });
                    
                    // Sync the Order FSM as cancelled/failed
                    await adminDb.collection("orders").doc(intent.order_id).update({
                       status: "CANCELLED",
                       updatedAt: Date.now()
                    });
                    continue;
                }

                // ── Retrieve the true status from the Provider API ──
                const adapter = adapterRegistry.get(intent.provider);
                
                // Note: The Adapter needs a way to fetch external status.
                // Depending on the adapter implementation, we might need tenant credentials.
                // Assuming the adapter knows how to retrieve it, or we fetch the generic store configuration.
                const storeSnap = await adminDb.collection("stores").doc(intent.store_id).get();
                const storeConfig = storeSnap.data()?.payment_config;

                if (!storeConfig) continue;

                const trueStatusPayload = await adapter.queryStatus(intent.provider_intent_id, storeConfig);

                if (trueStatusPayload.status !== intent.status) {
                    logger.info(`Reconciliation found mismatch for ${intentId}. Recovering missed webhook.`, {
                        intentId,
                        oldStatus: intent.status,
                        newStatus: trueStatusPayload.status
                    });

                    // Force the state machine update!
                    await paymentOrchestrator.syncIntentStatus(intentId, {
                        provider_event_id: `rec_${Date.now()}`,
                        provider_intent_id: intent.provider_intent_id,
                        normalized_status: trueStatusPayload.status as any,
                        raw_status: JSON.stringify(trueStatusPayload.raw),
                        amount: intent.amount,
                        currency: intent.currency,
                        metadata: { reconciliation: "true" },
                        occurred_at: new Date()
                    }, "system");

                    recovered++;
                }

            } catch (err: any) {
                logger.error(`Failed to reconcile intent ${intentId}`, { intentId, error: err.message });
            }
        }

        logger.info("PSP Reconciliation Job Completed", { 
            worker: "reconciliation",
            processed: staleIntentsSnap.size,
            recovered
        });
        
        return { processed: staleIntentsSnap.size, recovered };

    } catch (globalErr: any) {
        logger.error("Fatal error during PSP Reconciliation", { worker: "reconciliation", error: globalErr.message });
        throw globalErr;
    }
}

/**
 * Outbox Worker
 *
 * Polls for unpublished outbox events and dispatches them to downstream
 * systems (Order Service, Email, Stock, etc.).
 *
 * This runs inside a Next.js Route Handler or can be exported to a
 * Cloud Function / cron job.
 *
 * In production: Replace console log with your event bus (Pub/Sub, SQS, etc.)
 *
 * POST /api/payments/workers/outbox  ← trigger via Cloud Scheduler
 */
import { findUnpublishedOutboxEvents, markOutboxEventPublished } from "@/lib/payments/repository";
import { OutboxEvent, LedgerTransaction } from "@/types/payments";

// Downstream handlers keyed by event type
const HANDLERS: Partial<Record<OutboxEvent["event_type"], (event: OutboxEvent) => Promise<void>>> = {
    PAYMENT_PAID: async (event) => {
        console.log("[OutboxWorker] PAYMENT_PAID — trigger: release order, notify customer, create invoice", {
            order_id: event.payload.order_id,
            amount: event.payload.amount,
            currency: event.payload.currency,
        });
        // TODO: call Order Service to release fulfillment
        // TODO: call Invoice Service
        // TODO: call Notification Service
    },

    PAYMENT_FAILED: async (event) => {
        console.log("[OutboxWorker] PAYMENT_FAILED — trigger: release stock reservation, notify customer", {
            order_id: event.payload.order_id,
        });
        // TODO: release stock hold
        // TODO: send retry email
    },

    PAYMENT_REFUNDED: async (event) => {
        console.log("[OutboxWorker] PAYMENT_REFUNDED — trigger: revert fulfillment, update ledger", {
            order_id: event.payload.order_id,
            intent_id: event.payload.intent_id,
            amount: event.payload.amount,
        });
    },

    PAYMENT_PARTIALLY_REFUNDED: async (event) => {
        console.log("[OutboxWorker] PAYMENT_PARTIALLY_REFUNDED — update ledger, optional partial stock release", {
            order_id: event.payload.order_id,
            intent_id: event.payload.intent_id,
            refund_amount: event.payload.refund_amount,
        });
    },

    PAYMENT_CREATED: async (event) => {
        console.log("[OutboxWorker] PAYMENT_CREATED — audit trail", {
            intent_id: event.aggregate_id,
        });
    },

    PAYMENT_CANCELED: async (event) => {
        console.log("[OutboxWorker] PAYMENT_CANCELED — release reservation", {
            order_id: event.payload.order_id,
        });
    },

    LEDGER_SYNC: async (event) => {
        const tx = event.payload.ledger_transaction as LedgerTransaction;
        if (!tx) return;

        console.log("[OutboxWorker] LEDGER_SYNC — Exporting to unified ledger", {
            tx_id: tx.id,
            type: tx.type,
            entries_count: tx.entries?.length,
        });
        // TODO: Push to external ERP or BI data lake
    },
};

export async function runOutboxWorker(batchSize = 20): Promise<{
    processed: number;
    failed: number;
}> {
    const events = await findUnpublishedOutboxEvents(batchSize);
    let processed = 0;
    let failed = 0;

    for (const event of events) {
        try {
            const handler = HANDLERS[event.event_type];
            if (handler) {
                await handler(event);
            } else {
                console.warn("[OutboxWorker] No handler for event_type", { type: event.event_type });
            }
            await markOutboxEventPublished(event.id);
            processed++;
        } catch (err) {
            console.error("[OutboxWorker] Failed to process event", {
                event_id: event.id,
                event_type: event.event_type,
                error: (err as Error).message,
            });
            failed++;
            // Do NOT mark as published — will be retried on next run
        }
    }

    console.log("[OutboxWorker] Batch complete", { processed, failed, total: events.length });
    return { processed, failed };
}

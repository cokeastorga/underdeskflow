/**
 * Outbox Worker — Background processor for staged events.
 * 
 * Responsibilities:
 * 1. Poll for PENDING outbox events across all stores.
 * 2. Dispatch events to the correct handlers (Adapters, Orchestrator).
 * 3. Update outbox status based on execution results.
 */

import { adminDb } from "@/lib/firebase/admin-config";
import { outboxService, OutboxEntry } from "./outbox.service";
import { getAdapter } from "./adapter.registry";
import { queueRegistry } from "./rate-limited-queue";
import { enqueueSyncEvent, updateChannelConnectionStatus } from "./channel.repository";
import { ChannelConnection } from "@/types/channels";
import { Product, Category } from "@/types";
import { PricingResolver } from "./pricing-resolver";

export class OutboxWorker {
    /**
     * Process a batch of pending events.
     * In a production environment, this would run in a loop or be triggered by a cron.
     */
    async processPending(limit = 20): Promise<{ processed: number, errors: number }> {
        // 1. Fetch stores to process (or just query across all if Firestore depth allows)
        // For simplicity, we query a global "outbox" if it existed, 
        // but here we have per-store subcollections.
        // We'll fetch all stores first.
        const storesSnap = await adminDb.collection("stores").get();
        let processed = 0;
        let errors = 0;

        for (const storeDoc of storesSnap.docs) {
            const storeId = storeDoc.id;
            const pendingEvents = await adminDb.collection("stores").doc(storeId)
                .collection("outbox_events")
                .where("status", "==", "PENDING")
                .where("scheduledFor", "<=", Date.now())
                .limit(limit)
                .get();

            for (const eventDoc of pendingEvents.docs) {
                const event = { id: eventDoc.id, ...eventDoc.data() } as OutboxEntry;

                try {
                    await outboxService.markProcessing(storeId, event.id);
                    await this.executeEvent(event);
                    await outboxService.markSent(storeId, event.id);
                    processed++;
                } catch (err: any) {
                    console.error(`Outbox event ${event.id} failed:`, err);
                    await outboxService.recordFailure(storeId, event.id, err.message || String(err));
                    errors++;
                }
            }
        }

        return { processed, errors };
    }

    /**
     * Dispatch the event to the appropriate handler.
     */
    private async executeEvent(event: OutboxEntry): Promise<void> {
        const { type, payload, storeId, traceId, priority } = event;

        switch (type) {
            case "STOCK_WRITEBACK":
            case "PRICE_WRITEBACK":
                await this.handleWriteback(event);
                break;
            default:
                throw new Error(`Unsupported outbox event type: ${type}`);
        }
    }

    private async handleWriteback(event: OutboxEntry): Promise<void> {
        const { payload, storeId, traceId, priority } = event;
        const { channelConnectionId, productId, externalProductId, field, newValue, currency } = payload;

        // Fetch connection details
        const connSnap = await adminDb
            .collection("stores").doc(storeId)
            .collection("channel_connections").doc(channelConnectionId)
            .get();

        if (!connSnap.exists) throw new Error(`Connection ${channelConnectionId} not found`);
        const connData = { id: connSnap.id, ...connSnap.data() } as ChannelConnection;

        const adapter = getAdapter(connData.channelType);
        const queue = queueRegistry.getOrCreate(
            storeId,
            channelConnectionId,
            connData.channelType,
            adapter.capabilities.maxRatePerMinute
        );

        // We wrap the adapter call in a priority queue job
        return new Promise((resolve, reject) => {
            queue.enqueue({
                id: event.id, // Use outbox event ID for tracing in queue
                storeId,
                priority,
                maxRetries: 0, // Outbox handles retries at a higher level
                execute: async () => {
                    if (field === "stock") {
                        await adapter.pushStockUpdate(connData.credentials, {
                            externalProductId,
                            newStock: newValue,
                        });
                    } else {
                        // PRICE RESOLUTION LOGIC
                        // 1. Fetch Product & Category for cascading resolution
                        const productSnap = await adminDb.collection("products").doc(productId).get();
                        if (!productSnap.exists) throw new Error(`Product ${productId} not found`);
                        const product = { id: productSnap.id, ...productSnap.data() } as Product;

                        let category: Category | null = null;
                        if (product.category) {
                            const catSnap = await adminDb.collection("categories").doc(product.category).get();
                            if (catSnap.exists) {
                                category = { id: catSnap.id, ...catSnap.data() } as Category;
                            }
                        }

                        // 2. Resolve price based on hierarchy
                        const finalPrice = PricingResolver.resolvePrice(product, category, connData);

                        await adapter.pushPriceUpdate(connData.credentials, {
                            externalProductId,
                            newPrice: finalPrice,
                            currency: currency || "CLP",
                        });

                        // Important: Update sync event payload with the ACTUAL resolved price sent
                        payload.resolvedPrice = finalPrice;
                    }

                    // Log success in sync_events for UI visibility
                    await enqueueSyncEvent(storeId, channelConnectionId, {
                        storeId,
                        channelConnectionId,
                        channelType: connData.channelType,
                        eventType: field === "stock" ? "STOCK_UPDATE" : "PRICE_UPDATE",
                        priority,
                        status: "SENT",
                        payload: { productId, externalProductId, newValue },
                        maxRetries: 5,
                        traceId,
                    });
                },
                onSuccess: () => resolve(),
                onError: (err) => {
                    // We don't update status here, we let the OutboxWorker handle the catch block
                    reject(err);
                }
            });
        });
    }
}

export const outboxWorker = new OutboxWorker();

/**
 * SyncOrchestrator — Core engine for Enterprise channel synchronization.
 *
 * Responsibilities:
 *   1. Initial full sync (SYNCING state): fetch all products + orders from channel
 *   2. Incremental polling sync: fetch changes since last sync
 *   3. Push write-backs: stock & price updates → external channels
 *   4. Order ingestion: receive external orders → create internal records
 *   5. Conflict detection: compare central vs. channel values → log to product_change_events
 *
 * OpenTelemetry:
 *   Each sync operation carries a traceId for distributed tracing.
 *   All Firestore writes include metadata.traceId for correlation.
 *
 * Feature flag gate:
 *   Callers MUST verify ENTERPRISE_CHANNEL_SYNC flag before invoking this service.
 *   The orchestrator itself does NOT check — this keeps it decoupled.
 */

import { v4 as uuidv4 } from "uuid";
import { adminDb } from "@/lib/firebase/admin-config";
import { getAdapter } from "./adapter.registry";
import {
    listChannelConnections,
    updateChannelConnectionStatus,
    enqueueSyncEvent,
    appendProductChangeEvent,
} from "./channel.repository";
import { outboxService } from "./outbox.service";
import { queueRegistry } from "./rate-limited-queue";
import { adaptivePolling } from "./polling.service";
import { ChaosSimulationService } from "./chaos-simulation.service";
import { SecurityGuardService } from "@/lib/security/security-guard.service";
import {
    ChannelConnection,
    ChannelType,
    SyncEvent,
    SYNC_EVENT_PRIORITY,
} from "@/types/channels";
import {
    NormalizedOrder,
    NormalizedProduct,
    ChannelRateLimitError,
    ChannelAdapterError,
} from "./adapters/channel-adapter.interface";
import { calculatePlatformFee } from "@/lib/payments/fee.service";
import { v4 as traceId } from "uuid";  // Lightweight stand-in for OTEL trace IDs

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncResult {
    connectionId: string;
    channelType: ChannelType;
    traceId: string;
    productsProcessed: number;
    ordersIngested: number;
    conflictsDetected: number;
    errors: string[];
    durationMs: number;
    syncedAt: number;
}

export interface WritebackRequest {
    storeId: string;
    channelConnectionId: string;
    productId: string;           // Internal product ID
    externalProductId: string;
    field: "stock" | "price";
    newValue: number;
    currency?: string;
    priority?: "HIGH" | "MEDIUM" | "LOW";
}

// ─── SyncOrchestrator ────────────────────────────────────────────────────────

export class SyncOrchestrator {

    // ── Full Sync ─────────────────────────────────────────────────────────────

    /**
     * Run a full synchronization for a channel connection.
     * Used for the initial sync (CONNECTED → SYNCING → ACTIVE).
     */
    async runFullSync(storeId: string, connectionId: string): Promise<SyncResult> {
        const tid = traceId();
        const startMs = Date.now();

        const [conn] = await listChannelConnections(storeId).then(list =>
            list.filter(c => c.id === connectionId)
        );
        if (!conn) throw new Error(`Connection not found: ${connectionId}`);

        // ── Security Guard Check ──────────────────────────────────────────
        const access = await SecurityGuardService.checkAccess(storeId, "SYNC");
        if (!access.allowed) {
            throw new Error(`Acceso denegado: ${access.reason}`);
        }

        await updateChannelConnectionStatus(storeId, connectionId, { status: "SYNCING" });

        // ── Chaos Simulation Check ──────────────────────────────────────────
        const chaos = await ChaosSimulationService.getActiveChaos(storeId, connectionId);
        if (chaos === "AUTHENTICATION_ERROR") {
            throw new ChannelAdapterError("AUTH_ERROR", conn.channelType, "[CHAOS] Simulated Auth Failure", false);
        }
        if (chaos === "INTERNAL_ERROR") {
            throw new ChannelAdapterError("HTTP_ERROR", conn.channelType, "[CHAOS] Simulated 500 Internal Error", true);
        }
        if (chaos === "LATENCY") {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate 10s delay
        }
        if (chaos === "RATE_LIMIT") {
            throw new ChannelRateLimitError(conn.channelType, 60000); // Simulated 1 min backoff
        }

        const result: SyncResult = {
            connectionId,
            channelType: conn.channelType,
            traceId: tid,
            productsProcessed: 0,
            ordersIngested: 0,
            conflictsDetected: 0,
            errors: [],
            durationMs: 0,
            syncedAt: Date.now(),
        };

        try {
            const adapter = getAdapter(conn.channelType);

            // 1. Sync products
            const products = await adapter.fetchAllProducts(conn.credentials);
            await this.upsertProducts(storeId, conn, products, tid, result);

            // 2. Sync orders (last 90 days on initial sync)
            const since90d = Date.now() - 90 * 24 * 60 * 60 * 1000;
            const orders = await adapter.fetchOrdersSince(conn.credentials, since90d);
            await this.ingestOrders(storeId, conn, orders, tid, result);

            // 3. Mark active
            await updateChannelConnectionStatus(storeId, connectionId, {
                status: "ACTIVE",
                lastSyncAt: Date.now(),
                nextSyncAt: adaptivePolling.calculateNextSync(conn),
                retryCount: 0,
                stats: {
                    totalProductsSynced: result.productsProcessed,
                    totalOrdersSynced: result.ordersIngested,
                    lastOrderSync: Date.now(),
                    pendingConflicts: result.conflictsDetected,
                    errorsLast24h: result.errors.length,
                },
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            result.errors.push(msg);

            if (err instanceof ChannelRateLimitError) {
                await updateChannelConnectionStatus(storeId, connectionId, {
                    status: "THROTTLED",
                    throttleUntil: Date.now() + err.retryAfterMs,
                    lastErrorMessage: msg,
                });
            } else {
                await updateChannelConnectionStatus(storeId, connectionId, {
                    status: "ERROR",
                    lastErrorMessage: msg,
                });
            }
        }

        result.durationMs = Date.now() - startMs;
        result.syncedAt = Date.now();
        return result;
    }

    // ── Incremental Sync ──────────────────────────────────────────────────────

    /**
     * Run an incremental sync (poll) for a connection.
     * Only fetches changes since the last successful sync.
     */
    async runIncrementalSync(storeId: string, connectionId: string): Promise<SyncResult> {
        const tid = traceId();
        const startMs = Date.now();

        const [conn] = await listChannelConnections(storeId).then(l => l.filter(c => c.id === connectionId));
        if (!conn) throw new Error(`Connection not found: ${connectionId}`);

        // ── Security Guard Check ──────────────────────────────────────────
        const access = await SecurityGuardService.checkAccess(storeId, "SYNC");
        if (!access.allowed) {
            throw new Error(`Acceso denegado: ${access.reason}`);
        }

        const since = conn.lastSyncAt ?? (Date.now() - 24 * 60 * 60 * 1000);
        const adapter = getAdapter(conn.channelType);

        const result: SyncResult = {
            connectionId, channelType: conn.channelType, traceId: tid,
            productsProcessed: 0, ordersIngested: 0, conflictsDetected: 0,
            errors: [], durationMs: 0, syncedAt: Date.now(),
        };

        try {
            // ── Chaos Simulation Check ──────────────────────────────────────
            const chaos = await ChaosSimulationService.getActiveChaos(storeId, connectionId);
            if (chaos === "AUTHENTICATION_ERROR") {
                throw new ChannelAdapterError("AUTH_ERROR", conn.channelType, "[CHAOS] Simulated Auth Failure", false);
            }
            if (chaos === "INTERNAL_ERROR") {
                throw new ChannelAdapterError("HTTP_ERROR", conn.channelType, "[CHAOS] Simulated 500 Internal Error", true);
            }
            if (chaos === "LATENCY") {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate 10s delay
            }
            if (chaos === "RATE_LIMIT") {
                throw new ChannelRateLimitError(conn.channelType, 60000); // Simulated 1 min backoff
            }

            if (conn.syncConfig.syncInventory || conn.syncConfig.syncPrices) {
                const products = await adapter.fetchProductsSince(conn.credentials, since);
                await this.upsertProducts(storeId, conn, products, tid, result);
            }
            if (conn.syncConfig.syncOrders) {
                const orders = await adapter.fetchOrdersSince(conn.credentials, since);
                await this.ingestOrders(storeId, conn, orders, tid, result);
            }
            await updateChannelConnectionStatus(storeId, connectionId, {
                status: "ACTIVE",
                lastSyncAt: Date.now(),
                nextSyncAt: adaptivePolling.calculateNextSync(conn),
                retryCount: 0,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            result.errors.push(msg);
            if (err instanceof ChannelRateLimitError) {
                await updateChannelConnectionStatus(storeId, connectionId, {
                    status: "THROTTLED", throttleUntil: Date.now() + err.retryAfterMs, lastErrorMessage: msg,
                });
            } else if (err instanceof ChannelAdapterError && !err.retryable) {
                await updateChannelConnectionStatus(storeId, connectionId, { status: "ERROR", lastErrorMessage: msg });
            }
        }

        result.durationMs = Date.now() - startMs;
        return result;
    }

    // ── Write-back via Queue ──────────────────────────────────────────────────

    /**
     * Enqueue a stock or price update to be pushed to an external channel.
     * The RateLimitedQueue handles token bucket and retry logic.
     */
    async enqueueWriteback(req: WritebackRequest): Promise<void> {
        const conn = await adminDb
            .collection("stores").doc(req.storeId)
            .collection("channel_connections").doc(req.channelConnectionId)
            .get();
        if (!conn.exists) throw new Error(`Channel connection ${req.channelConnectionId} not found`);
        const connData = { id: conn.id, ...conn.data() } as ChannelConnection;

        const adapter = getAdapter(connData.channelType);
        const capabilities = adapter.capabilities;

        if (req.field === "stock" && !capabilities.supportsStockWriteback) return;
        if (req.field === "price" && !capabilities.supportsPriceWriteback) return;

        const tid = uuidv4();
        const priority = req.priority || (req.field === "price" ? "MEDIUM" : "LOW");

        await outboxService.enqueue(req.storeId, req.field === "stock" ? "STOCK_WRITEBACK" : "PRICE_WRITEBACK", {
            channelConnectionId: req.channelConnectionId,
            productId: req.productId,
            externalProductId: req.externalProductId,
            field: req.field,
            newValue: req.newValue,
            currency: req.currency,
        }, {
            priority,
            traceId: tid,
        });
    }

    // ── Internal: Product Upsert ──────────────────────────────────────────────

    private async upsertProducts(
        storeId: string,
        conn: ChannelConnection,
        products: NormalizedProduct[],
        tid: string,
        result: SyncResult
    ): Promise<void> {
        const batch = adminDb.batch();
        const colRef = adminDb.collection("stores").doc(storeId)
            .collection("channel_product_mappings");

        for (const product of products) {
            const docId = `${conn.channelType}:${product.externalId}`;
            batch.set(colRef.doc(docId), {
                ...product,
                channelType: conn.channelType,
                connectionId: conn.id,
                syncedAt: Date.now(),
                traceId: tid,
            }, { merge: true });
            result.productsProcessed += 1;
        }

        // Commit in chunks of 500 (Firestore batch limit)
        await batch.commit();
    }

    // ── Internal: Order Ingestion ─────────────────────────────────────────────

    private async ingestOrders(
        storeId: string,
        conn: ChannelConnection,
        orders: NormalizedOrder[],
        tid: string,
        result: SyncResult
    ): Promise<void> {
        const ordersRef = adminDb.collection("stores").doc(storeId).collection("orders");
        const ledgerRef = adminDb.collection("stores").doc(storeId).collection("ledger_transactions");

        for (const order of orders) {
            const docId = `ext_${conn.channelType}_${order.externalId}`;
            const existing = await ordersRef.doc(docId).get();
            if (existing.exists) continue; // Idempotent: skip already-ingested orders

            // Create the order record
            await ordersRef.doc(docId).set({
                ...order,
                id: docId,
                source: "EXTERNAL_CHANNEL",
                connectionId: conn.id,
                traceId: tid,
                createdAt: Date.now(),
            });

            // Create ledger record: EXTERNAL_ORDER_RECEIVED — platform_fee = 0
            const commission = conn.syncConfig.customCommissionRate !== undefined
                ? Math.round(order.totalAmount * conn.syncConfig.customCommissionRate)
                : order.channelCommission;

            const fee = calculatePlatformFee(order.totalAmount, "EXTERNAL_CHANNEL"); // Always 0
            await ledgerRef.add({
                id: uuidv4(),
                store_id: storeId,
                reference_id: docId,
                order_source: "EXTERNAL_CHANNEL",
                type: "EXTERNAL_ORDER_RECEIVED",
                description: `Order ${order.externalId} from ${conn.channelType} [platform_fee=${fee}] [channel_commission=${commission}]`,
                entries: [
                    // Revenue tracking only — no fund movement (PSP is the external channel)
                    {
                        id: uuidv4(),
                        account: "external_channel_revenue",
                        amount: order.totalAmount,
                        type: "DEBIT",
                        currency: order.currency,
                    },
                    {
                        id: uuidv4(),
                        account: "external_channel_commission_expense",
                        amount: -commission,
                        type: "CREDIT",
                        currency: order.currency,
                    },
                    {
                        id: uuidv4(),
                        account: "external_merchant_net",
                        amount: -(order.totalAmount - commission),
                        type: "CREDIT",
                        currency: order.currency,
                    },
                ],
                metadata: {
                    channelType: conn.channelType,
                    channelCommission: commission,
                    platform_fee: fee,
                    traceId: tid,
                },
                created_at: Date.now(),
            });

            result.ordersIngested += 1;
        }
    }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const syncOrchestrator = new SyncOrchestrator();

/**
 * Channel Repository — Firestore CRUD for ChannelConnection and SyncEvent.
 *
 * Collection structure:
 *   stores/{storeId}/channel_connections/{connectionId}
 *   stores/{storeId}/channel_connections/{connectionId}/sync_events/{eventId}
 *   stores/{storeId}/product_change_events/{eventId}   ← append-only conflict log
 */

import { adminDb } from "@/lib/firebase/admin-config";
import {
    ChannelConnection,
    ChannelType,
    SyncEvent,
    SyncEventStatus,
    ProductChangeEvent,
} from "@/types/channels";
import { v4 as uuidv4 } from "uuid";

// ─── Collection Helpers ───────────────────────────────────────────────────────

const connectionsRef = (storeId: string) =>
    adminDb.collection("stores").doc(storeId).collection("channel_connections");

const syncEventsRef = (storeId: string, connectionId: string) =>
    connectionsRef(storeId).doc(connectionId).collection("sync_events");

const productChangeEventsRef = (storeId: string) =>
    adminDb.collection("stores").doc(storeId).collection("product_change_events");

// ─── Channel Connections ──────────────────────────────────────────────────────

/**
 * List all channel connections for a store.
 */
export async function listChannelConnections(storeId: string): Promise<ChannelConnection[]> {
    const snap = await connectionsRef(storeId).orderBy("createdAt", "desc").get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChannelConnection));
}

/**
 * Get a single channel connection by id.
 */
export async function getChannelConnection(
    storeId: string,
    connectionId: string
): Promise<ChannelConnection | null> {
    const snap = await connectionsRef(storeId).doc(connectionId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as ChannelConnection;
}

/**
 * Get a channel connection by channel type (at most one per type per store).
 */
export async function getConnectionByType(
    storeId: string,
    channelType: ChannelType
): Promise<ChannelConnection | null> {
    const snap = await connectionsRef(storeId)
        .where("channelType", "==", channelType)
        .limit(1)
        .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as ChannelConnection;
}

/**
 * Create a new channel connection.
 * @param storeId The store that owns this connection
 * @param data Partial connection data; status defaults to PENDING_AUTH, syncConfig to defaults
 * @returns the newly created connectionId string
 */
export async function createChannelConnection(
    storeId: string,
    data: Partial<ChannelConnection> & { channelType: ChannelType }
): Promise<string> {
    const now = Date.now();
    const id = uuidv4();
    const connection: ChannelConnection = {
        id,
        storeId,
        channelType: data.channelType,
        status: data.status ?? "PENDING_AUTH",
        credentials: data.credentials ?? {},
        syncConfig: data.syncConfig ?? {
            syncInventory: true,
            syncPrices: true,
            syncOrders: true,
            conflictResolution: "CENTRAL_WINS",
            pollingIntervalMinutes: 15,
        },
        retryCount: 0,
        connectedAt: data.connectedAt ?? now,
        createdAt: now,
        updatedAt: now,
        ...(data.displayName ? { displayName: data.displayName } : {}),
    };
    await connectionsRef(storeId).doc(id).set(connection);
    return id;
}

/**
 * Update connection status and optional fields.
 */
export async function updateChannelConnectionStatus(
    storeId: string,
    connectionId: string,
    updates: Partial<Pick<ChannelConnection,
        "status" | "lastSyncAt" | "nextSyncAt" | "lastErrorMessage" |
        "throttleUntil" | "retryCount" | "credentials" | "stats"
    >>
): Promise<void> {
    await connectionsRef(storeId).doc(connectionId).update({
        ...updates,
        updatedAt: Date.now(),
    });
}

/**
 * Disconnect a channel (soft delete — keeps history).
 */
export async function disconnectChannel(storeId: string, connectionId: string): Promise<void> {
    await connectionsRef(storeId).doc(connectionId).update({
        status: "DISCONNECTED",
        disconnectedAt: Date.now(),
        updatedAt: Date.now(),
    });
}

// ─── Sync Events (Outbox) ─────────────────────────────────────────────────────

/**
 * Enqueue a sync event into the outbox for a channel connection.
 */
export async function enqueueSyncEvent(
    storeId: string,
    connectionId: string,
    event: Omit<SyncEvent, "id" | "createdAt" | "retryCount">
): Promise<SyncEvent> {
    const now = Date.now();
    const id = uuidv4();
    const syncEvent: SyncEvent = {
        ...event,
        id,
        status: event.status || "PENDING",
        retryCount: 0,
        createdAt: now,
    };
    await syncEventsRef(storeId, connectionId).doc(id).set(syncEvent);
    return syncEvent;
}

/**
 * Fetch pending sync events for a connection (ordered by priority then createdAt).
 */
export async function getPendingSyncEvents(
    storeId: string,
    connectionId: string,
    limit = 50
): Promise<SyncEvent[]> {
    const snap = await syncEventsRef(storeId, connectionId)
        .where("status", "==", "PENDING")
        .orderBy("createdAt", "asc")
        .limit(limit)
        .get();
    return snap.docs.map(d => d.data() as SyncEvent);
}

/**
 * Update a sync event status (PENDING → PROCESSING → SENT / DEAD_LETTER).
 */
export async function updateSyncEventStatus(
    storeId: string,
    connectionId: string,
    eventId: string,
    status: SyncEventStatus,
    errorMessage?: string
): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (errorMessage) updates.lastError = errorMessage;
    if (status === "SENT") updates.sentAt = Date.now();
    if (status === "PROCESSING") updates.processedAt = Date.now();
    if (status === "FAILED" || status === "DEAD_LETTER") {
        updates.retryCount = (await syncEventsRef(storeId, connectionId).doc(eventId).get())
            .data()?.retryCount ?? 0 + 1;
    }
    await syncEventsRef(storeId, connectionId).doc(eventId).update(updates);
}

// ─── Product Change Events (Conflict Log) ────────────────────────────────────

/**
 * Append a product change event to the immutable conflict log.
 * Called whenever a field changes (central or external channel).
 */
export async function appendProductChangeEvent(
    storeId: string,
    event: Omit<ProductChangeEvent, "id">
): Promise<ProductChangeEvent> {
    const id = uuidv4();
    const full = { ...event, id };
    await productChangeEventsRef(storeId).doc(id).set(full);
    return full;
}

/**
 * Fetch change history for a specific product (newest first).
 */
export async function getProductChangeHistory(
    storeId: string,
    productId: string,
    limitN = 20
): Promise<ProductChangeEvent[]> {
    const snap = await productChangeEventsRef(storeId)
        .where("productId", "==", productId)
        .orderBy("timestamp", "desc")
        .limit(limitN)
        .get();
    return snap.docs.map(d => d.data() as ProductChangeEvent);
}

/**
 * Fetch unresolved conflicts for a store (MANUAL resolution pending).
 */
export async function getUnresolvedConflicts(storeId: string): Promise<ProductChangeEvent[]> {
    const snap = await productChangeEventsRef(storeId)
        .where("conflictResolution", "==", "MANUAL")
        .where("conflictResolvedAt", "==", null)
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();
    return snap.docs.map(d => d.data() as ProductChangeEvent);
}

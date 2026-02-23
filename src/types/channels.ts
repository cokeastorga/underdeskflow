/**
 * Channel Connection Types — Multistore Platform
 *
 * Defines the data model for external channel integrations (Enterprise plan only).
 * A ChannelConnection represents a merchant's link to an external marketplace or store platform.
 */

// ─── Channel Identity ────────────────────────────────────────────────────────

export type ChannelType =
    | "shopify"
    | "woocommerce"
    | "mercadolibre"
    | "pedidosya"
    | "tiendanube"
    | "falabella"
    | "rappi";

export const CHANNEL_DISPLAY: Record<ChannelType, { name: string; icon: string; color: string }> = {
    shopify: { name: "Shopify", icon: "🛍️", color: "#96BF48" },
    woocommerce: { name: "WooCommerce", icon: "🛒", color: "#7F54B3" },
    mercadolibre: { name: "Mercado Libre", icon: "🛒", color: "#FFE600" },
    pedidosya: { name: "PedidosYa", icon: "🛵", color: "#FA2E5C" },
    tiendanube: { name: "Tiendanube", icon: "☁️", color: "#6BC5F8" },
    falabella: { name: "Falabella", icon: "🏪", color: "#8B0000" },
    rappi: { name: "Rappi", icon: "🍕", color: "#FF441F" },
};

// ─── Connection Status FSM ───────────────────────────────────────────────────

export type ChannelConnectionStatus =
    | "PENDING_AUTH"     // OAuth flow not yet completed / API key not set
    | "CONNECTED"        // Credentials verified, initial sync not yet started
    | "SYNCING"          // Initial full sync in progress
    | "ACTIVE"           // Syncing normally (webhooks + polling)
    | "THROTTLED"        // API rate-limited, backoff in progress
    | "ERROR"            // Permanent or repeated error, needs attention
    | "DISCONNECTED"     // Intentionally disconnected by merchant
    | "SUSPENDED";       // Suspended by platform (e.g., compliance issue)

export const CHANNEL_STATUS_DISPLAY: Record<ChannelConnectionStatus, {
    label: string;
    color: string;
    dot: "green" | "yellow" | "red" | "gray";
}> = {
    PENDING_AUTH: { label: "Pendiente", color: "text-yellow-500", dot: "yellow" },
    CONNECTED: { label: "Conectado", color: "text-blue-500", dot: "yellow" },
    SYNCING: { label: "Sincronizando", color: "text-blue-400", dot: "yellow" },
    ACTIVE: { label: "Activo", color: "text-green-500", dot: "green" },
    THROTTLED: { label: "Throttled", color: "text-orange-400", dot: "yellow" },
    ERROR: { label: "Error", color: "text-red-500", dot: "red" },
    DISCONNECTED: { label: "Desconectado", color: "text-zinc-400", dot: "gray" },
    SUSPENDED: { label: "Suspendido", color: "text-red-600", dot: "red" },
};

// ─── Connection Model ────────────────────────────────────────────────────────

export interface ChannelCredentials {
    /** OAuth access token (encrypted at rest) */
    accessToken?: string;
    /** OAuth refresh token (encrypted at rest) */
    refreshToken?: string;
    /** Static API key (Store API key for Shopify, etc.) */
    apiKey?: string;
    /** Shop/store URL or domain on the channel (e.g. "mystore.myshopify.com") */
    shopDomain?: string;
    /** External store/account ID on the channel */
    externalStoreId?: string;
    /** Token expiry timestamp (ms) */
    expiresAt?: number;
    /** Webhook secret for HMAC verification */
    webhookSecret?: string;
}

export interface ChannelSyncStats {
    totalProductsSynced: number;
    totalOrdersSynced: number;
    lastStockUpdate?: number;    // timestamp ms
    lastPriceUpdate?: number;
    lastOrderSync?: number;
    pendingConflicts: number;    // Unresolved price/stock conflicts
    errorsLast24h: number;
}

export interface ChannelConnection {
    id: string;
    storeId: string;              // Platform store that owns this connection
    channelType: ChannelType;
    status: ChannelConnectionStatus;

    // Credentials (sensitive fields stored encrypted in Firestore)
    credentials: ChannelCredentials;

    // Sync configuration
    syncConfig: {
        syncInventory: boolean;
        syncPrices: boolean;
        syncOrders: boolean;
        priceMarkupPercent?: number;     // Optional markup on top of central price
        conflictResolution: "CENTRAL_WINS" | "CHANNEL_WINS" | "MANUAL" | "LATEST_WINS";
        pollingIntervalMinutes: number;   // Fallback polling interval
        customCommissionRate?: number;    // Optional override for channel commission (e.g. 0.12 for 12%)
    };

    // Runtime state
    lastSyncAt?: number;          // timestamp ms
    nextSyncAt?: number;          // timestamp ms (scheduled poll)
    lastErrorMessage?: string;
    throttleUntil?: number;       // timestamp ms — when THROTTLED backoff ends
    retryCount: number;

    // Stats
    stats?: ChannelSyncStats;

    // Optional display name (e.g. Shopify shop name returned by verifyCredentials)
    displayName?: string;

    // Audit
    connectedAt: number;
    disconnectedAt?: number;
    createdAt: number;
    updatedAt: number;
}

// ─── Sync Events (Outbox) ────────────────────────────────────────────────────

export type SyncEventType =
    | "STOCK_UPDATE"
    | "PRICE_UPDATE"
    | "PRODUCT_CREATE"
    | "PRODUCT_UPDATE"
    | "PRODUCT_DELETE"
    | "ORDER_CREATED"
    | "ORDER_UPDATED"
    | "REFUND_ISSUED";

export type SyncEventStatus =
    | "PENDING"
    | "PROCESSING"
    | "SENT"
    | "FAILED"
    | "DEAD_LETTER";

export type SyncEventPriority = "HIGH" | "MEDIUM" | "LOW";

// Priority map: orders first, then prices, then stock
export const SYNC_EVENT_PRIORITY: Record<SyncEventType, SyncEventPriority> = {
    ORDER_CREATED: "HIGH",
    ORDER_UPDATED: "HIGH",
    REFUND_ISSUED: "HIGH",
    PRICE_UPDATE: "MEDIUM",
    PRODUCT_CREATE: "MEDIUM",
    PRODUCT_UPDATE: "MEDIUM",
    PRODUCT_DELETE: "MEDIUM",
    STOCK_UPDATE: "LOW",
};

export interface SyncEvent {
    id: string;
    storeId: string;
    channelConnectionId: string;
    channelType: ChannelType;
    eventType: SyncEventType;
    priority: SyncEventPriority;
    status: SyncEventStatus;

    payload: Record<string, unknown>;    // Normalized event data

    retryCount: number;
    maxRetries: number;                  // Default: 5
    lastError?: string;
    traceId: string;                     // OpenTelemetry trace ID

    createdAt: number;
    processedAt?: number;
    sentAt?: number;
}

// ─── Conflict Model ──────────────────────────────────────────────────────────

export type ConflictResolutionMode = "CENTRAL_WINS" | "CHANNEL_WINS" | "MANUAL" | "LATEST_WINS";

export interface ProductChangeEvent {
    id: string;
    storeId: string;
    productId: string;
    externalProductId?: string;
    channelType: ChannelType;
    field: "price" | "stock" | "title" | "description" | "images" | "status";
    previousValue: string;
    newValue: string;
    source: "channel_sync" | "manual" | "api";
    resolvedBy?: string;                  // User ID or "auto"
    resolutionStrategy?: "PLATFORM_WINS" | "CHANNEL_WINS" | "MANUAL";
    metadata?: Record<string, unknown>;
    createdAt: number;
    resolved: boolean;
    resolvedAt?: number;
}

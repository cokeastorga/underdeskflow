/**
 * ChannelAdapter — Core interface for all external channel integrations.
 *
 * Every channel (Shopify, WooCommerce, ML, PedidosYa, Tiendanube, etc.)
 * implements this interface. The SyncOrchestrator calls these methods
 * without knowing which channel it is talking to.
 *
 * Design principles:
 *   - All methods receive/return NORMALIZED types (not channel-specific DTOs)
 *   - Errors are thrown as ChannelAdapterError (never raw Axios/fetch errors)
 *   - Rate-limit signals are returned as ChannelRateLimitError for the queue to handle
 *   - Credentials are passed in at construction time, not stored globally
 */

import { ChannelCredentials, ChannelType, SyncEvent } from "@/types/channels";

// ─── Normalized Domain Types ──────────────────────────────────────────────────

export interface NormalizedProduct {
    externalId: string;         // ID on the external channel
    internalId?: string;        // Our platform product ID (set after mapping)
    title: string;
    description?: string;
    sku?: string;
    barcode?: string;
    price: number;              // In the store's base currency (CLP/ARS/USD)
    currency: string;
    stock: number;
    status: "active" | "draft" | "archived";
    images: string[];
    variants?: NormalizedVariant[];
    externalUrl?: string;
    lastModifiedAt?: number;   // External channel's last modified timestamp
}

export interface NormalizedVariant {
    externalId: string;
    title: string;
    sku?: string;
    price: number;
    stock: number;
    options: Record<string, string>; // e.g. { Color: "Red", Size: "M" }
}

export type NormalizedOrderStatus =
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded"
    | "partially_refunded";

export interface NormalizedOrderLine {
    externalProductId: string;
    internalProductId?: string;
    title: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
}

export interface NormalizedOrder {
    externalId: string;          // Order ID on the external channel
    internalId?: string;         // Our platform order ID (after mapping)
    channelType: ChannelType;
    status: NormalizedOrderStatus;
    currency: string;
    subtotal: number;
    shippingCost: number;
    channelCommission: number;   // e.g. ML 12% — tracked but NOT charged by platform
    totalAmount: number;
    lines: NormalizedOrderLine[];
    customer: {
        externalId?: string;
        name: string;
        email?: string;
        phone?: string;
    };
    shippingAddress?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
    };
    placedAt: number;           // timestamp ms
    updatedAt: number;
    externalUrl?: string;
}

export interface StockUpdate {
    externalProductId: string;
    externalVariantId?: string;
    newStock: number;
    reason?: string;
}

export interface PriceUpdate {
    externalProductId: string;
    externalVariantId?: string;
    newPrice: number;
    currency: string;
}

// ─── Adapter Metadata ─────────────────────────────────────────────────────────

export interface AdapterCapabilities {
    supportsWebhooks: boolean;
    supportsPolling: boolean;
    supportsStockWriteback: boolean;  // Can the adapter push stock changes back?
    supportsPriceWriteback: boolean;  // Can the adapter push price changes back?
    supportsOrderRead: boolean;
    supportsProductRead: boolean;
    maxRatePerMinute: number;         // API rate limit
    requiresOAuth: boolean;
    requiresApiKey: boolean;
}

// ─── Error Types ──────────────────────────────────────────────────────────────

export class ChannelAdapterError extends Error {
    constructor(
        public readonly code: string,
        public readonly channelType: ChannelType,
        message: string,
        public readonly retryable: boolean = true,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = "ChannelAdapterError";
    }
}

export class ChannelRateLimitError extends ChannelAdapterError {
    constructor(
        channelType: ChannelType,
        public readonly retryAfterMs: number
    ) {
        super("RATE_LIMITED", channelType, `Channel ${channelType} rate-limited. Retry after ${retryAfterMs}ms`, true);
        this.name = "ChannelRateLimitError";
    }
}

export class ChannelAuthError extends ChannelAdapterError {
    constructor(channelType: ChannelType, message: string) {
        super("AUTH_ERROR", channelType, message, false);
        this.name = "ChannelAuthError";
    }
}

// ─── Core Adapter Interface ───────────────────────────────────────────────────

export interface ChannelAdapter {
    /** The channel type this adapter handles */
    readonly channelType: ChannelType;
    /** Capabilities manifest — read by SyncOrchestrator to decide strategy */
    readonly capabilities: AdapterCapabilities;

    /**
     * Verify that the provided credentials are valid.
     * Called during onboarding and after credential rotation.
     * @throws ChannelAuthError if credentials are invalid
     */
    verifyCredentials(credentials: ChannelCredentials): Promise<{ valid: boolean; shopName?: string }>;

    /**
     * Fetch all products from the channel.
     * Used for the initial full sync (SYNCING state).
     * May paginate internally — returns the full list.
     */
    fetchAllProducts(credentials: ChannelCredentials): Promise<NormalizedProduct[]>;

    /**
     * Fetch products modified since a given timestamp.
     * Used for incremental polling syncs.
     */
    fetchProductsSince(credentials: ChannelCredentials, since: number): Promise<NormalizedProduct[]>;

    /**
     * Push a stock update to the external channel.
     * @throws ChannelRateLimitError on 429
     * @throws ChannelAdapterError on non-retryable errors
     */
    pushStockUpdate(credentials: ChannelCredentials, update: StockUpdate): Promise<void>;

    /**
     * Push a price update to the external channel.
     */
    pushPriceUpdate(credentials: ChannelCredentials, update: PriceUpdate): Promise<void>;

    /**
     * Fetch orders placed on the channel since a timestamp.
     * Returns normalized orders — `channelCommission` is included for ledger tracking.
     */
    fetchOrdersSince(credentials: ChannelCredentials, since: number): Promise<NormalizedOrder[]>;

    /**
     * Parse a raw webhook payload into a SyncEvent.
     * Returns null if the event type is not supported.
     * @throws ChannelAuthError if HMAC signature is invalid
     */
    parseWebhook(
        headers: Record<string, string>,
        rawBody: Buffer,
        secret: string
    ): Promise<Partial<SyncEvent> | null>;

    /**
     * Return the URL to point webhooks at for this channel.
     * Called during channel connection setup.
     */
    getWebhookUrl(storeId: string): string;
}

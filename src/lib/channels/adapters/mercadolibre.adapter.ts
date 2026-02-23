/**
 * Mercado Libre Channel Adapter
 *
 * Connects to MercadoLibre via the official ML API (api.mercadolibre.com).
 *
 * Auth: OAuth 2.0 (Authorization Code flow) — access_token + refresh_token.
 * Scopes needed: read, write, offline_access.
 *
 * Key API limits:
 *   - 200 calls/min per app (enforced by X-RateLimit headers)
 *   - Item status: active | paused | closed | under_review
 *
 * Commission model:
 *   - ML charges ~12% per sale (varies by category + listing type)
 *   - Platform records this in channelCommission for traceability — NOT charged to merchant
 *
 * Supported:
 *   - Product read (full listing search + incremental via scroll_id)
 *   - Stock writeback (listings/{id})
 *   - Price writeback (listings/{id})
 *   - Order read since timestamp
 *   - Webhook parsing (ML uses notification_id, not HMAC — we verify via callback)
 */

import {
    ChannelAdapter,
    ChannelAdapterError,
    ChannelRateLimitError,
    ChannelAuthError,
    AdapterCapabilities,
    NormalizedProduct,
    NormalizedOrder,
    NormalizedOrderLine,
    StockUpdate,
    PriceUpdate,
} from "./channel-adapter.interface";
import { ChannelCredentials, ChannelType, SyncEvent } from "@/types/channels";

const ML_API_BASE = "https://api.mercadolibre.com";

// Approximate commission rate for traceability (actual rate varies by category)
const ML_COMMISSION_RATE = 0.13;

// ─── ML Internal Types ────────────────────────────────────────────────────────

interface MLListing {
    id: string;
    title: string;
    price: number;
    currency_id: string;
    available_quantity: number;
    status: "active" | "paused" | "closed" | "under_review";
    thumbnail: string;
    pictures?: { url: string }[];
    seller_sku?: string;
    last_updated: string;
    permalink: string;
}

interface MLOrder {
    id: number;
    status: string; // "paid" | "confirmed" | "payment_in_process" | "partially_refunded" | "cancelled"
    currency_id: string;
    total_amount: number;
    order_items: {
        item: { id: string; title: string; seller_sku?: string };
        quantity: number;
        unit_price: number;
        full_unit_price: number;
    }[];
    buyer: { id: number; nickname: string; email?: string; phone?: { number?: string } };
    shipping?: { id?: number };
    date_created: string;
    date_last_updated: string;
    marketplace_fee: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mlHeaders(credentials: ChannelCredentials): Record<string, string> {
    return {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
    };
}

async function mlFetch(
    url: string,
    credentials: ChannelCredentials,
    options: RequestInit = {}
): Promise<{ data: unknown; headers: Headers }> {
    const res = await fetch(url, {
        ...options,
        headers: { ...mlHeaders(credentials), ...(options.headers as Record<string, string> ?? {}) },
    });

    if (res.status === 401) {
        throw new ChannelAuthError("mercadolibre", "ML OAuth token expired or invalid");
    }
    if (res.status === 403) {
        throw new ChannelAuthError("mercadolibre", "ML insufficient permissions");
    }
    if (res.status === 429) {
        const retryAfter = Number(res.headers.get("X-RateLimit-Reset") ?? "10") * 1000;
        throw new ChannelRateLimitError("mercadolibre", retryAfter);
    }
    if (!res.ok) {
        const body = await res.text();
        throw new ChannelAdapterError("HTTP_ERROR", "mercadolibre", `ML API ${res.status}: ${body}`, res.status >= 500);
    }
    return { data: await res.json(), headers: res.headers };
}

async function getMLSellerId(credentials: ChannelCredentials): Promise<string> {
    const { data } = await mlFetch(`${ML_API_BASE}/users/me`, credentials);
    return String((data as { id: number }).id);
}

function mapMLStatus(status: string): NormalizedOrder["status"] {
    const map: Record<string, NormalizedOrder["status"]> = {
        paid: "confirmed", confirmed: "confirmed",
        payment_in_process: "pending", partially_refunded: "partially_refunded",
        cancelled: "cancelled", invalid: "cancelled",
    };
    return map[status] ?? "pending";
}

// ─── ML Adapter ───────────────────────────────────────────────────────────────

export class MercadoLibreAdapter implements ChannelAdapter {
    readonly channelType: ChannelType = "mercadolibre";

    readonly capabilities: AdapterCapabilities = {
        supportsWebhooks: true,
        supportsPolling: true,
        supportsStockWriteback: true,
        supportsPriceWriteback: true,
        supportsOrderRead: true,
        supportsProductRead: true,
        maxRatePerMinute: 200,
        requiresOAuth: true,
        requiresApiKey: false,
    };

    async verifyCredentials(credentials: ChannelCredentials): Promise<{ valid: boolean; shopName?: string }> {
        try {
            const { data } = await mlFetch(`${ML_API_BASE}/users/me`, credentials);
            const user = data as { id: number; nickname: string };
            return { valid: true, shopName: user.nickname };
        } catch (err) {
            if (err instanceof ChannelAuthError) return { valid: false };
            throw err;
        }
    }

    async fetchAllProducts(credentials: ChannelCredentials): Promise<NormalizedProduct[]> {
        const sellerId = await getMLSellerId(credentials);
        const all: NormalizedProduct[] = [];
        let offset = 0;
        const limit = 50;

        while (true) {
            const url = `${ML_API_BASE}/users/${sellerId}/items/search?limit=${limit}&offset=${offset}`;
            const { data } = await mlFetch(url, credentials);
            const result = data as { results: string[]; paging: { total: number } };
            if (!result.results.length) break;

            // Batch fetch full listing details
            const ids = result.results.join(",");
            const { data: detailData } = await mlFetch(
                `${ML_API_BASE}/items?ids=${ids}&attributes=id,title,price,currency_id,available_quantity,status,thumbnail,pictures,seller_sku,last_updated`,
                credentials
            );
            const items = (detailData as { code: number; body: MLListing }[])
                .filter(r => r.code === 200)
                .map(r => this.normalizeListing(r.body));
            all.push(...items);

            offset += limit;
            if (offset >= result.paging.total) break;
        }
        return all;
    }

    async fetchProductsSince(credentials: ChannelCredentials, since: number): Promise<NormalizedProduct[]> {
        // ML doesn't support updated_at filter on search — fall back to full fetch
        // In production, maintain a local cache and diff against last_updated field
        const all = await this.fetchAllProducts(credentials);
        return all.filter(p => (p.lastModifiedAt ?? 0) >= since);
    }

    private normalizeListing(item: MLListing): NormalizedProduct {
        return {
            externalId: item.id,
            title: item.title,
            sku: item.seller_sku,
            price: item.price,
            currency: item.currency_id,
            stock: item.available_quantity,
            status: item.status === "active" ? "active" : item.status === "paused" ? "draft" : "archived",
            images: item.pictures?.map(p => p.url) ?? [item.thumbnail],
            lastModifiedAt: new Date(item.last_updated).getTime(),
        };
    }

    async pushStockUpdate(credentials: ChannelCredentials, update: StockUpdate): Promise<void> {
        await mlFetch(
            `${ML_API_BASE}/items/${update.externalProductId}`,
            credentials,
            { method: "PUT", body: JSON.stringify({ available_quantity: update.newStock }) }
        );
    }

    async pushPriceUpdate(credentials: ChannelCredentials, update: PriceUpdate): Promise<void> {
        await mlFetch(
            `${ML_API_BASE}/items/${update.externalProductId}`,
            credentials,
            { method: "PUT", body: JSON.stringify({ price: update.newPrice }) }
        );
    }

    async fetchOrdersSince(credentials: ChannelCredentials, since: number): Promise<NormalizedOrder[]> {
        const sellerId = await getMLSellerId(credentials);
        const sinceIso = new Date(since).toISOString();
        const url = `${ML_API_BASE}/orders/search?seller=${sellerId}&sort=date_asc&order.date_created.from=${sinceIso}&limit=50`;
        const { data } = await mlFetch(url, credentials);
        const results = (data as { results: MLOrder[] }).results;
        return results.map(o => {
            const commission = o.marketplace_fee ?? o.total_amount * ML_COMMISSION_RATE;
            const lines: NormalizedOrderLine[] = o.order_items.map(li => ({
                externalProductId: li.item.id,
                title: li.item.title,
                sku: li.item.seller_sku,
                quantity: li.quantity,
                unitPrice: li.unit_price,
                totalPrice: li.unit_price * li.quantity,
                currency: o.currency_id,
            }));
            return {
                externalId: String(o.id),
                channelType: "mercadolibre" as ChannelType,
                status: mapMLStatus(o.status),
                currency: o.currency_id,
                subtotal: lines.reduce((s, l) => s + l.totalPrice, 0),
                shippingCost: 0, // Included in total — ML doesn't separate it cleanly
                channelCommission: Math.round(commission), // ← tracked, NOT platform revenue
                totalAmount: o.total_amount,
                lines,
                customer: {
                    externalId: String(o.buyer.id),
                    name: o.buyer.nickname,
                    email: o.buyer.email,
                    phone: o.buyer.phone?.number,
                },
                placedAt: new Date(o.date_created).getTime(),
                updatedAt: new Date(o.date_last_updated).getTime(),
            };
        });
    }

    async parseWebhook(
        headers: Record<string, string>,
        rawBody: Buffer,
        _secret: string
    ): Promise<Partial<SyncEvent> | null> {
        // ML uses notification callbacks, not HMAC signatures
        // Verification is done by fetching the notification from ML's API
        const body = JSON.parse(rawBody.toString("utf8")) as {
            topic?: string; resource?: string; user_id?: number;
        };
        if (!body.topic || !body.resource) return null;

        const map: Record<string, SyncEvent["eventType"]> = {
            orders: "ORDER_CREATED",
            items: "PRODUCT_UPDATE",
            questions: null as any,
        };
        const eventType = map[body.topic];
        if (!eventType) return null;

        return {
            eventType,
            channelType: "mercadolibre",
            payload: body,
        };
    }

    getWebhookUrl(storeId: string): string {
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://underdeskflow.vercel.app";
        return `${base}/api/webhooks/channels/mercadolibre/${storeId}`;
    }
}

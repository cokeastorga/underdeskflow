/**
 * Tiendanube / Nuvemshop Channel Adapter
 *
 * Connects to Tiendanube stores via their REST API v1.
 * Auth: OAuth 2.0 — user_id + access_token.
 *
 * Rate limits: ~180 req/min per app.
 * Products: paginated via Link header (same as Shopify).
 * Orders: filtered by created_at_min / updated_at_min.
 *
 * Commission: Tiendanube charges monthly subscription, not per-order.
 * channelCommission = 0 for Tiendanube orders.
 */

import crypto from "crypto";
import {
    ChannelAdapter,
    ChannelAdapterError,
    ChannelRateLimitError,
    ChannelAuthError,
    AdapterCapabilities,
    NormalizedProduct,
    NormalizedVariant,
    NormalizedOrder,
    NormalizedOrderLine,
    StockUpdate,
    PriceUpdate,
} from "./channel-adapter.interface";
import { ChannelCredentials, ChannelType, SyncEvent, SyncEventType } from "@/types/channels";

const TN_API_BASE = "https://api.tiendanube.com/v1";

// ─── TN Internal Types ─────────────────────────────────────────────────────────

interface TNVariant {
    id: number; sku: string; price: string; promotional_price: string | null;
    stock: number | null; values: { es: string }[];
}

interface TNProduct {
    id: number; name: { es: string }; description: { es: string };
    handle: { es: string }; published: boolean;
    variants: TNVariant[];
    images: { src: string }[];
    updated_at: string;
}

interface TNOrder {
    id: number; token: string; status: string; payment_status: string;
    cancel_reason: string | null; currency: string;
    total: string; subtotal: string; shipping_cost_owner: string;
    products: {
        product_id: number; variant_id: number;
        name: string; sku: string; quantity: number; price: string;
    }[];
    customer: { name: string; email: string; phone: string };
    shipping_address?: {
        address: string; city: string; province: string;
        country: string; zipcode: string;
    };
    created_at: string; updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tnHeaders(credentials: ChannelCredentials): Record<string, string> {
    return {
        Authentication: `bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "DPapp/1.0 (dpapp.cl)",
    };
}

async function tnFetch(
    url: string,
    credentials: ChannelCredentials,
    options: RequestInit = {}
): Promise<{ data: unknown; headers: Headers }> {
    const userId = credentials.externalStoreId ?? "";
    const fullUrl = `${TN_API_BASE}/${userId}${url.startsWith("/") ? url : `/${url}`}`;
    const res = await fetch(fullUrl, {
        ...options,
        headers: { ...tnHeaders(credentials), ...(options.headers as Record<string, string> ?? {}) },
    });
    if (res.status === 401 || res.status === 403) throw new ChannelAuthError("tiendanube", `Auth failed: ${res.status}`);
    if (res.status === 429) throw new ChannelRateLimitError("tiendanube", 10_000);
    if (!res.ok) throw new ChannelAdapterError("HTTP_ERROR", "tiendanube", `TN error ${res.status}`, res.status >= 500);
    return { data: await res.json(), headers: res.headers };
}

function mapTNStatus(status: string, payStatus: string): NormalizedOrder["status"] {
    if (status === "cancelled") return "cancelled";
    if (payStatus === "refunded") return "refunded";
    if (status === "closed" || payStatus === "paid") return "delivered";
    if (payStatus === "pending") return "pending";
    return "processing";
}

// ─── Tiendanube Adapter ────────────────────────────────────────────────────────

export class TiendanubeAdapter implements ChannelAdapter {
    readonly channelType: ChannelType = "tiendanube";

    readonly capabilities: AdapterCapabilities = {
        supportsWebhooks: true,
        supportsPolling: true,
        supportsStockWriteback: true,
        supportsPriceWriteback: true,
        supportsOrderRead: true,
        supportsProductRead: true,
        maxRatePerMinute: 180,
        requiresOAuth: true,
        requiresApiKey: false,
    };

    async verifyCredentials(credentials: ChannelCredentials): Promise<{ valid: boolean; shopName?: string }> {
        try {
            const { data } = await tnFetch("/", credentials);
            const store = data as { name?: { es?: string } };
            return { valid: true, shopName: store.name?.es };
        } catch (err) {
            if (err instanceof ChannelAuthError) return { valid: false };
            throw err;
        }
    }

    async fetchAllProducts(credentials: ChannelCredentials): Promise<NormalizedProduct[]> {
        const all: NormalizedProduct[] = [];
        let page = 1;
        while (true) {
            const { data } = await tnFetch(`/products?per_page=200&page=${page}`, credentials);
            const items = data as TNProduct[];
            if (!items.length) break;
            all.push(...items.map(p => this.normalizeProduct(p)));
            page++;
        }
        return all;
    }

    async fetchProductsSince(credentials: ChannelCredentials, since: number): Promise<NormalizedProduct[]> {
        const sinceStr = new Date(since).toISOString();
        const { data } = await tnFetch(`/products?updated_at_min=${sinceStr}&per_page=200`, credentials);
        return (data as TNProduct[]).map(p => this.normalizeProduct(p));
    }

    private normalizeProduct(p: TNProduct): NormalizedProduct {
        const primaryVariant = p.variants[0];
        const variants: NormalizedVariant[] = p.variants.map(v => ({
            externalId: String(v.id),
            title: v.values.map(val => val.es).join(" / "),
            sku: v.sku,
            price: parseFloat(v.promotional_price ?? v.price),
            stock: v.stock ?? 0,
            options: {},
        }));
        return {
            externalId: String(p.id),
            title: p.name.es,
            description: p.description.es.replace(/<[^>]*>/g, ""),
            sku: primaryVariant?.sku,
            price: parseFloat(primaryVariant?.price ?? "0"),
            currency: "ARS", // Default — Tiendanube is primarily Argentina
            stock: variants.reduce((s, v) => s + v.stock, 0),
            status: p.published ? "active" : "draft",
            images: p.images.map(i => i.src),
            variants,
            lastModifiedAt: new Date(p.updated_at).getTime(),
        };
    }

    async pushStockUpdate(credentials: ChannelCredentials, update: StockUpdate): Promise<void> {
        const variantId = update.externalVariantId ?? "1";
        await tnFetch(`/products/${update.externalProductId}/variants/${variantId}`, credentials, {
            method: "PUT", body: JSON.stringify({ stock: update.newStock }),
        });
    }

    async pushPriceUpdate(credentials: ChannelCredentials, update: PriceUpdate): Promise<void> {
        const variantId = update.externalVariantId ?? "1";
        await tnFetch(`/products/${update.externalProductId}/variants/${variantId}`, credentials, {
            method: "PUT", body: JSON.stringify({ price: String(update.newPrice) }),
        });
    }

    async fetchOrdersSince(credentials: ChannelCredentials, since: number): Promise<NormalizedOrder[]> {
        const sinceStr = new Date(since).toISOString();
        const { data } = await tnFetch(`/orders?created_at_min=${sinceStr}&per_page=200`, credentials);
        return (data as TNOrder[]).map(o => ({
            externalId: String(o.id),
            channelType: "tiendanube" as ChannelType,
            status: mapTNStatus(o.status, o.payment_status),
            currency: o.currency,
            subtotal: parseFloat(o.subtotal),
            shippingCost: parseFloat(o.shipping_cost_owner),
            channelCommission: 0, // No per-order commission
            totalAmount: parseFloat(o.total),
            lines: o.products.map(li => ({
                externalProductId: String(li.product_id),
                title: li.name, sku: li.sku,
                quantity: li.quantity,
                unitPrice: parseFloat(li.price),
                totalPrice: parseFloat(li.price) * li.quantity,
                currency: o.currency,
            })),
            customer: { name: o.customer.name, email: o.customer.email, phone: o.customer.phone },
            shippingAddress: o.shipping_address
                ? {
                    street: o.shipping_address.address, city: o.shipping_address.city,
                    state: o.shipping_address.province, country: o.shipping_address.country,
                    postalCode: o.shipping_address.zipcode,
                }
                : undefined,
            placedAt: new Date(o.created_at).getTime(),
            updatedAt: new Date(o.updated_at).getTime(),
        }));
    }

    async parseWebhook(headers: Record<string, string>, rawBody: Buffer, secret: string): Promise<Partial<SyncEvent> | null> {
        // Tiendanube uses HMAC-SHA256 via X-Linkedstore-Token header
        const sig = headers["x-linkedstore-token"] ?? "";
        const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
        if (sig && !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computed))) {
            throw new ChannelAuthError("tiendanube", "Webhook signature mismatch");
        }
        const body = JSON.parse(rawBody.toString("utf8")) as { event?: string };
        const map: Record<string, SyncEventType> = {
            "app/uninstalled": null as any,
            "order/created": "ORDER_CREATED",
            "order/paid": "ORDER_UPDATED",
            "order/packed": "ORDER_UPDATED",
            "order/fulfilled": "ORDER_UPDATED",
            "product/created": "PRODUCT_CREATE",
            "product/updated": "PRODUCT_UPDATE",
            "product/deleted": "PRODUCT_DELETE",
        };
        const eventType = map[body.event ?? ""];
        if (!eventType) return null;
        return { eventType, channelType: "tiendanube", payload: body };
    }

    getWebhookUrl(storeId: string): string {
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dpapp.cl";
        return `${base}/api/webhooks/channels/tiendanube/${storeId}`;
    }
}

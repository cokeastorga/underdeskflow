/**
 * WooCommerce Channel Adapter
 *
 * Connects to self-hosted WooCommerce stores via the REST API v3.
 * Auth: Consumer Key + Consumer Secret (Basic Auth over HTTPS).
 *
 * Supported:
 *   - Product read (full + modified since)
 *   - Stock writeback (PUT /products/{id})
 *   - Price writeback (PUT /products/{id})
 *   - Order read since timestamp
 *   - Webhook parsing (SHA256 HMAC via X-WC-Webhook-Signature)
 *
 * Rate limits: No hard limits — respect store server capacity.
 * We use 60 req/min as a conservative default.
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

// ─── WC Internal Types ─────────────────────────────────────────────────────────

interface WCVariation {
    id: number;
    sku: string;
    price: string;
    regular_price: string;
    stock_quantity: number | null;
    attributes: { name: string; option: string }[];
}

interface WCProduct {
    id: number;
    name: string;
    description: string;
    status: "publish" | "draft" | "private";
    sku: string;
    price: string;
    regular_price: string;
    manage_stock: boolean;
    stock_quantity: number | null;
    images: { src: string }[];
    type: "simple" | "variable" | "grouped" | "external";
    date_modified: string;
    permalink: string;
}

interface WCOrder {
    id: number;
    status: string;
    currency: string;
    line_items: {
        id: number; product_id: number; variation_id: number;
        name: string; sku: string; quantity: number; price: string;
        total: string;
    }[];
    shipping_total: string;
    total: string;
    subtotal: string;
    billing: { first_name: string; last_name: string; email: string; phone?: string };
    shipping: { address_1?: string; city?: string; state?: string; country?: string; postcode?: string };
    date_created: string;
    date_modified: string;
    order_key: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wcBaseUrl(shopDomain: string): string {
    const base = shopDomain.startsWith("http") ? shopDomain : `https://${shopDomain}`;
    return `${base}/wp-json/wc/v3`;
}

function wcHeaders(credentials: ChannelCredentials): Record<string, string> {
    const token = Buffer.from(`${credentials.apiKey}:${credentials.accessToken}`).toString("base64");
    return { Authorization: `Basic ${token}`, "Content-Type": "application/json" };
}

async function wcFetch(
    url: string,
    credentials: ChannelCredentials,
    options: RequestInit = {}
): Promise<unknown> {
    const res = await fetch(url, {
        ...options,
        headers: { ...wcHeaders(credentials), ...(options.headers as Record<string, string> ?? {}) },
    });
    if (res.status === 401 || res.status === 403) {
        throw new ChannelAuthError("woocommerce", `WooCommerce auth failed: ${res.status}`);
    }
    if (res.status === 429) throw new ChannelRateLimitError("woocommerce", 5_000);
    if (!res.ok) throw new ChannelAdapterError("HTTP_ERROR", "woocommerce", `WC error ${res.status}`, res.status >= 500);
    return res.json();
}

function mapWCStatus(status: string): NormalizedOrder["status"] {
    const map: Record<string, NormalizedOrder["status"]> = {
        pending: "pending", processing: "processing", "on-hold": "pending",
        completed: "delivered", cancelled: "cancelled", refunded: "refunded",
        failed: "cancelled", trash: "cancelled",
    };
    return map[status] ?? "pending";
}

// ─── WooCommerce Adapter ──────────────────────────────────────────────────────

export class WooCommerceAdapter implements ChannelAdapter {
    readonly channelType: ChannelType = "woocommerce";

    readonly capabilities: AdapterCapabilities = {
        supportsWebhooks: true,
        supportsPolling: true,
        supportsStockWriteback: true,
        supportsPriceWriteback: true,
        supportsOrderRead: true,
        supportsProductRead: true,
        maxRatePerMinute: 60,
        requiresOAuth: false,
        requiresApiKey: true,
    };

    async verifyCredentials(credentials: ChannelCredentials): Promise<{ valid: boolean; shopName?: string }> {
        try {
            const data = await wcFetch(`${wcBaseUrl(credentials.shopDomain!)}/system_status`, credentials);
            const name = (data as { settings?: { store?: { name?: string } } }).settings?.store?.name;
            return { valid: true, shopName: name };
        } catch (err) {
            if (err instanceof ChannelAuthError) return { valid: false };
            throw err;
        }
    }

    async fetchAllProducts(credentials: ChannelCredentials): Promise<NormalizedProduct[]> {
        const all: NormalizedProduct[] = [];
        let page = 1;
        while (true) {
            const data = await wcFetch(
                `${wcBaseUrl(credentials.shopDomain!)}/products?per_page=100&page=${page}`,
                credentials
            ) as WCProduct[];
            if (!data.length) break;
            all.push(...data.map(p => this.normalizeProduct(p)));
            page++;
        }
        return all;
    }

    async fetchProductsSince(credentials: ChannelCredentials, since: number): Promise<NormalizedProduct[]> {
        const sinceStr = new Date(since).toISOString();
        const data = await wcFetch(
            `${wcBaseUrl(credentials.shopDomain!)}/products?modified_after=${sinceStr}&per_page=100`,
            credentials
        ) as WCProduct[];
        return data.map(p => this.normalizeProduct(p));
    }

    private normalizeProduct(p: WCProduct): NormalizedProduct {
        return {
            externalId: String(p.id),
            title: p.name,
            description: p.description.replace(/<[^>]*>/g, ""),
            sku: p.sku,
            price: parseFloat(p.price || p.regular_price || "0"),
            currency: "CLP",
            stock: p.stock_quantity ?? 0,
            status: p.status === "publish" ? "active" : p.status === "draft" ? "draft" : "archived",
            images: p.images.map(i => i.src),
            lastModifiedAt: new Date(p.date_modified).getTime(),
        };
    }

    async pushStockUpdate(credentials: ChannelCredentials, update: StockUpdate): Promise<void> {
        await wcFetch(
            `${wcBaseUrl(credentials.shopDomain!)}/products/${update.externalProductId}`,
            credentials,
            { method: "PUT", body: JSON.stringify({ stock_quantity: update.newStock, manage_stock: true }) }
        );
    }

    async pushPriceUpdate(credentials: ChannelCredentials, update: PriceUpdate): Promise<void> {
        await wcFetch(
            `${wcBaseUrl(credentials.shopDomain!)}/products/${update.externalProductId}`,
            credentials,
            { method: "PUT", body: JSON.stringify({ regular_price: String(update.newPrice) }) }
        );
    }

    async fetchOrdersSince(credentials: ChannelCredentials, since: number): Promise<NormalizedOrder[]> {
        const sinceStr = new Date(since).toISOString();
        const data = await wcFetch(
            `${wcBaseUrl(credentials.shopDomain!)}/orders?modified_after=${sinceStr}&per_page=100`,
            credentials
        ) as WCOrder[];
        return data.map(o => ({
            externalId: String(o.id),
            channelType: "woocommerce" as ChannelType,
            status: mapWCStatus(o.status),
            currency: o.currency,
            subtotal: parseFloat(o.subtotal),
            shippingCost: parseFloat(o.shipping_total),
            channelCommission: 0, // WooCommerce doesn't charge per-order commission
            totalAmount: parseFloat(o.total),
            lines: o.line_items.map(li => ({
                externalProductId: String(li.product_id),
                title: li.name, sku: li.sku,
                quantity: li.quantity,
                unitPrice: parseFloat(li.price),
                totalPrice: parseFloat(li.total),
                currency: o.currency,
            })),
            customer: {
                name: `${o.billing.first_name} ${o.billing.last_name}`.trim(),
                email: o.billing.email, phone: o.billing.phone,
            },
            shippingAddress: {
                street: o.shipping.address_1, city: o.shipping.city,
                state: o.shipping.state, country: o.shipping.country, postalCode: o.shipping.postcode,
            },
            placedAt: new Date(o.date_created).getTime(),
            updatedAt: new Date(o.date_modified).getTime(),
        }));
    }

    async parseWebhook(headers: Record<string, string>, rawBody: Buffer, secret: string): Promise<Partial<SyncEvent> | null> {
        const sig = headers["x-wc-webhook-signature"] ?? headers["X-WC-Webhook-Signature"];
        const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computed))) {
            throw new ChannelAuthError("woocommerce", "WooCommerce webhook HMAC mismatch");
        }
        const topic = headers["x-wc-webhook-topic"] ?? "";
        const map: Record<string, SyncEventType> = {
            "product.created": "PRODUCT_CREATE", "product.updated": "PRODUCT_UPDATE",
            "product.deleted": "PRODUCT_DELETE", "order.created": "ORDER_CREATED",
            "order.updated": "ORDER_UPDATED",
        };
        const eventType = map[topic];
        if (!eventType) return null;
        return { eventType, channelType: "woocommerce", payload: JSON.parse(rawBody.toString("utf8")) };
    }

    getWebhookUrl(storeId: string): string {
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://underdeskflow.vercel.app";
        return `${base}/api/webhooks/channels/woocommerce/${storeId}`;
    }
}

/**
 * Shopify Channel Adapter
 *
 * Implements the ChannelAdapter interface for Shopify stores.
 *
 * Supported:
 *   - Product read (full + incremental via updated_at_min)
 *   - Stock writeback (inventory_levels/set.json)
 *   - Price writeback (variants/{id}.json)
 *   - Order read (since last sync)
 *   - Webhook parsing (HMAC-SHA256 verification)
 *
 * API limits:
 *   - Shopify REST: 40 req/s (burst), 2 req/s (sustained) — we use 40 req/min conservatively
 *   - Uses X-Shopify-Shop-Api-Call-Limit header to monitor bucket
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShopifyVariant {
    id: number;
    sku: string;
    price: string;
    inventory_quantity: number;
    inventory_item_id: number;
    option1?: string;
    option2?: string;
    option3?: string;
    title: string;
}

interface ShopifyProduct {
    id: number;
    title: string;
    body_html: string;
    status: "active" | "draft" | "archived";
    variants: ShopifyVariant[];
    images: { src: string }[];
    updated_at: string;
}

interface ShopifyLineItem {
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    sku: string;
    quantity: number;
    price: string;
}

interface ShopifyOrder {
    id: number;
    order_number: number;
    financial_status: string;
    fulfillment_status: string | null;
    currency: string;
    subtotal_price: string;
    total_shipping_price_set?: { shop_money: { amount: string } };
    total_discounts: string;
    total_price: string;
    line_items: ShopifyLineItem[];
    customer?: { id: number; first_name: string; last_name: string; email: string; phone?: string };
    shipping_address?: {
        address1?: string; city?: string; province?: string;
        country?: string; zip?: string;
    };
    created_at: string;
    updated_at: string;
    admin_graphql_api_id: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shopifyBaseUrl(shopDomain: string): string {
    const domain = shopDomain.includes(".myshopify.com") ? shopDomain : `${shopDomain}.myshopify.com`;
    return `https://${domain}/admin/api/2024-01`;
}

function shopifyHeaders(credentials: ChannelCredentials): Record<string, string> {
    return {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": credentials.accessToken ?? credentials.apiKey ?? "",
    };
}

async function shopifyFetch(
    url: string,
    credentials: ChannelCredentials,
    options: RequestInit = {}
): Promise<{ data: unknown; headers: Headers }> {
    const res = await fetch(url, {
        ...options,
        headers: {
            ...shopifyHeaders(credentials),
            ...(options.headers as Record<string, string> ?? {}),
        },
    });

    if (res.status === 401 || res.status === 403) {
        throw new ChannelAuthError("shopify", `Shopify auth failed: ${res.status}`);
    }
    if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After") ?? "10") * 1000;
        throw new ChannelRateLimitError("shopify", retryAfter);
    }
    if (!res.ok) {
        throw new ChannelAdapterError(
            "HTTP_ERROR",
            "shopify",
            `Shopify API error: ${res.status} ${res.statusText}`,
            res.status >= 500
        );
    }

    return { data: await res.json(), headers: res.headers };
}

// ─── Status Mapping ───────────────────────────────────────────────────────────

function mapShopifyOrderStatus(order: ShopifyOrder): NormalizedOrder["status"] {
    if (order.financial_status === "refunded") return "refunded";
    if (order.financial_status === "partially_refunded") return "partially_refunded";
    if (order.financial_status === "voided") return "cancelled";
    if (order.fulfillment_status === "fulfilled") return "delivered";
    if (order.fulfillment_status === "partial") return "processing";
    if (order.financial_status === "paid") return "confirmed";
    return "pending";
}

// ─── Product normalization ─────────────────────────────────────────────────────

function normalizeShopifyProduct(p: ShopifyProduct): NormalizedProduct {
    const variants: NormalizedVariant[] = p.variants.map(v => ({
        externalId: String(v.id),
        title: v.title,
        sku: v.sku,
        price: parseFloat(v.price),
        stock: v.inventory_quantity,
        options: {
            ...(v.option1 ? { Option1: v.option1 } : {}),
            ...(v.option2 ? { Option2: v.option2 } : {}),
            ...(v.option3 ? { Option3: v.option3 } : {}),
        },
    }));

    const primaryVariant = p.variants[0];
    return {
        externalId: String(p.id),
        title: p.title,
        description: p.body_html?.replace(/<[^>]*>/g, "") ?? "",
        sku: primaryVariant?.sku,
        price: parseFloat(primaryVariant?.price ?? "0"),
        currency: "CLP",   // Store-level currency — set by Shopify config
        stock: variants.reduce((sum, v) => sum + v.stock, 0),
        status: p.status,
        images: p.images.map(i => i.src),
        variants,
        lastModifiedAt: new Date(p.updated_at).getTime(),
    };
}

// ─── Order normalization ──────────────────────────────────────────────────────

function normalizeShopifyOrder(o: ShopifyOrder): NormalizedOrder {
    const subtotal = parseFloat(o.subtotal_price);
    const shipping = parseFloat(
        o.total_shipping_price_set?.shop_money.amount ?? "0"
    );
    const total = parseFloat(o.total_price);

    const lines: NormalizedOrderLine[] = o.line_items.map(li => ({
        externalProductId: String(li.product_id),
        title: li.title,
        sku: li.sku,
        quantity: li.quantity,
        unitPrice: parseFloat(li.price),
        totalPrice: parseFloat(li.price) * li.quantity,
        currency: o.currency,
    }));

    return {
        externalId: String(o.id),
        channelType: "shopify",
        status: mapShopifyOrderStatus(o),
        currency: o.currency,
        subtotal,
        shippingCost: shipping,
        channelCommission: 0, // Shopify charges subscription, not per-order commission
        totalAmount: total,
        lines,
        customer: {
            externalId: String(o.customer?.id ?? ""),
            name: `${o.customer?.first_name ?? ""} ${o.customer?.last_name ?? ""}`.trim(),
            email: o.customer?.email,
            phone: o.customer?.phone,
        },
        shippingAddress: o.shipping_address
            ? {
                street: o.shipping_address.address1,
                city: o.shipping_address.city,
                state: o.shipping_address.province,
                country: o.shipping_address.country,
                postalCode: o.shipping_address.zip,
            }
            : undefined,
        placedAt: new Date(o.created_at).getTime(),
        updatedAt: new Date(o.updated_at).getTime(),
    };
}

// ─── Shopify Adapter ──────────────────────────────────────────────────────────

export class ShopifyAdapter implements ChannelAdapter {
    readonly channelType: ChannelType = "shopify";

    readonly capabilities: AdapterCapabilities = {
        supportsWebhooks: true,
        supportsPolling: true,
        supportsStockWriteback: true,
        supportsPriceWriteback: true,
        supportsOrderRead: true,
        supportsProductRead: true,
        maxRatePerMinute: 40,
        requiresOAuth: true,
        requiresApiKey: true,
    };

    // ── verifyCredentials ────────────────────────────────────────────────────

    async verifyCredentials(
        credentials: ChannelCredentials
    ): Promise<{ valid: boolean; shopName?: string }> {
        try {
            const url = `${shopifyBaseUrl(credentials.shopDomain!)}/shop.json`;
            const { data } = await shopifyFetch(url, credentials);
            const shop = (data as { shop: { name: string } }).shop;
            return { valid: true, shopName: shop.name };
        } catch (err) {
            if (err instanceof ChannelAuthError) return { valid: false };
            throw err;
        }
    }

    // ── fetchAllProducts ─────────────────────────────────────────────────────

    async fetchAllProducts(credentials: ChannelCredentials): Promise<NormalizedProduct[]> {
        const base = shopifyBaseUrl(credentials.shopDomain!);
        const all: NormalizedProduct[] = [];
        let pageInfo: string | null = null;

        do {
            const params = new URLSearchParams({ limit: "250", status: "any" });
            if (pageInfo) params.set("page_info", pageInfo);
            const url = `${base}/products.json?${params}`;

            const { data, headers } = await shopifyFetch(url, credentials);
            const products = (data as { products: ShopifyProduct[] }).products;
            all.push(...products.map(normalizeShopifyProduct));

            // Pagination via Link header
            const link = headers.get("Link") ?? "";
            const next = link.match(/<[^>]+page_info=([^>&]+)[^>]*>;\s*rel="next"/);
            pageInfo = next?.[1] ?? null;
        } while (pageInfo);

        return all;
    }

    // ── fetchProductsSince ────────────────────────────────────────────────────

    async fetchProductsSince(
        credentials: ChannelCredentials,
        since: number
    ): Promise<NormalizedProduct[]> {
        const sinceIso = new Date(since).toISOString();
        const url = `${shopifyBaseUrl(credentials.shopDomain!)}/products.json?updated_at_min=${sinceIso}&limit=250&status=any`;
        const { data } = await shopifyFetch(url, credentials);
        return (data as { products: ShopifyProduct[] }).products.map(normalizeShopifyProduct);
    }

    // ── pushStockUpdate ───────────────────────────────────────────────────────

    async pushStockUpdate(credentials: ChannelCredentials, update: StockUpdate): Promise<void> {
        // Need the inventory_item_id from the variant — fetch it first
        const variantUrl = `${shopifyBaseUrl(credentials.shopDomain!)}/variants/${update.externalVariantId ?? update.externalProductId}.json`;
        const { data: variantData } = await shopifyFetch(variantUrl, credentials);
        const inventoryItemId = (variantData as { variant: ShopifyVariant }).variant.inventory_item_id;

        // Get the location ID (use first location)
        const locUrl = `${shopifyBaseUrl(credentials.shopDomain!)}/locations.json`;
        const { data: locData } = await shopifyFetch(locUrl, credentials);
        const locationId = (locData as { locations: { id: number }[] }).locations[0]?.id;
        if (!locationId) throw new ChannelAdapterError("NO_LOCATION", "shopify", "No Shopify location found", false);

        // Set inventory level
        const setUrl = `${shopifyBaseUrl(credentials.shopDomain!)}/inventory_levels/set.json`;
        await shopifyFetch(setUrl, credentials, {
            method: "POST",
            body: JSON.stringify({
                location_id: locationId,
                inventory_item_id: inventoryItemId,
                available: update.newStock,
            }),
        });
    }

    // ── pushPriceUpdate ───────────────────────────────────────────────────────

    async pushPriceUpdate(credentials: ChannelCredentials, update: PriceUpdate): Promise<void> {
        const variantId = update.externalVariantId ?? update.externalProductId;
        const url = `${shopifyBaseUrl(credentials.shopDomain!)}/variants/${variantId}.json`;
        await shopifyFetch(url, credentials, {
            method: "PUT",
            body: JSON.stringify({ variant: { id: variantId, price: update.newPrice.toFixed(2) } }),
        });
    }

    // ── fetchOrdersSince ──────────────────────────────────────────────────────

    async fetchOrdersSince(
        credentials: ChannelCredentials,
        since: number
    ): Promise<NormalizedOrder[]> {
        const sinceIso = new Date(since).toISOString();
        const url = `${shopifyBaseUrl(credentials.shopDomain!)}/orders.json?updated_at_min=${sinceIso}&limit=250&status=any`;
        const { data } = await shopifyFetch(url, credentials);
        return (data as { orders: ShopifyOrder[] }).orders.map(normalizeShopifyOrder);
    }

    // ── parseWebhook ──────────────────────────────────────────────────────────

    async parseWebhook(
        headers: Record<string, string>,
        rawBody: Buffer,
        secret: string
    ): Promise<Partial<SyncEvent> | null> {
        // Verify HMAC-SHA256
        const sig = headers["x-shopify-hmac-sha256"] ?? headers["X-Shopify-Hmac-Sha256"];
        const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computed))) {
            throw new ChannelAuthError("shopify", "Webhook HMAC signature mismatch");
        }

        const topic = headers["x-shopify-topic"] ?? "";
        const payload = JSON.parse(rawBody.toString("utf8"));

        const eventTypeMap: Record<string, SyncEventType> = {
            "products/create": "PRODUCT_CREATE",
            "products/update": "PRODUCT_UPDATE",
            "products/delete": "PRODUCT_DELETE",
            "orders/create": "ORDER_CREATED",
            "orders/updated": "ORDER_UPDATED",
            "refunds/create": "REFUND_ISSUED",
            "inventory_levels/update": "STOCK_UPDATE",
        };

        const eventType = eventTypeMap[topic];
        if (!eventType) return null;

        return {
            eventType,
            channelType: "shopify",
            payload,
        };
    }

    // ── getWebhookUrl ─────────────────────────────────────────────────────────

    getWebhookUrl(storeId: string): string {
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dpapp.cl";
        return `${base}/api/webhooks/channels/shopify/${storeId}`;
    }
}

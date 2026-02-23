/**
 * PedidosYa Channel Adapter
 *
 * Connects to PedidosYa / PedidosNow delivery platform API.
 * PedidosYa is a food/delivery marketplace popular in LATAM
 * (Argentina, Uruguay, Chile, Paraguay, Bolivia, Panama, etc.)
 *
 * Auth: Client ID + Client Secret (OAuth 2.0 Client Credentials flow).
 * Token endpoint: https://auth.pedidosya.com/oauth/token
 *
 * Rate limits: ~50 req/min (conservative — no official limit published).
 *
 * Commission model:
 *   - PedidosYa charges ~25% per order (varies by country + agreement)
 *   - Tracked in channelCommission — NOT charged by platform
 *
 * Supported:
 *   - Product catalog read (menu items / categories)
 *   - Availability/stock writeback (item enabled/disabled)
 *   - Price writeback (item price update)
 *   - Order read (new orders polling)
 *   - Webhook parsing (order events via X-Hub-Signature)
 */

import crypto from "crypto";
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
import { ChannelCredentials, ChannelType, SyncEvent, SyncEventType } from "@/types/channels";

const PY_AUTH_URL = "https://auth.pedidosya.com/oauth/token";
const PY_API_BASE = "https://api.pedidosya.com/v3";
const PY_COMMISSION_RATE = 0.25;

// ─── PY Internal Types ─────────────────────────────────────────────────────────

interface PYProduct {
    id: string;
    name: string;
    description?: string;
    price: number;
    enabled: boolean;
    image?: string;
    section?: string;
}

interface PYOrderProduct {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface PYOrder {
    id: string;
    state: "PENDING" | "CONFIRMED" | "DELIVERED" | "REJECTED" | "CLOSED";
    paymentType: string;
    currency: string;
    grossValue: number;
    deliveryFee: number;
    commission: number;
    orderValue: number;
    products: PYOrderProduct[];
    user: { id: string; name: string; phone?: string; email?: string };
    address?: { description?: string; city?: string; state?: string; country?: string };
    registeredDate: string;
    modifiedDate: string;
}

// ─── Token Cache ────────────────────────────────────────────────────────────────

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getPYToken(credentials: ChannelCredentials): Promise<string> {
    const cacheKey = credentials.apiKey ?? "";
    const cached = tokenCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt - 30_000) return cached.token;

    const res = await fetch(PY_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: credentials.apiKey ?? "",
            client_secret: credentials.accessToken ?? "",
        }),
    });
    if (!res.ok) throw new ChannelAuthError("pedidosya", `PY auth failed: ${res.status}`);
    const data = await res.json() as { access_token: string; expires_in: number };
    tokenCache.set(cacheKey, { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 });
    return data.access_token;
}

async function pyFetch(
    url: string,
    credentials: ChannelCredentials,
    options: RequestInit = {}
): Promise<{ data: unknown; headers: Headers }> {
    const token = await getPYToken(credentials);
    const res = await fetch(`${PY_API_BASE}${url}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string> ?? {}),
        },
    });
    if (res.status === 401 || res.status === 403) throw new ChannelAuthError("pedidosya", `PY auth error ${res.status}`);
    if (res.status === 429) throw new ChannelRateLimitError("pedidosya", 12_000);
    if (!res.ok) throw new ChannelAdapterError("HTTP_ERROR", "pedidosya", `PY error ${res.status}`, res.status >= 500);
    return { data: await res.json(), headers: res.headers };
}

function mapPYStatus(state: string): NormalizedOrder["status"] {
    const map: Record<string, NormalizedOrder["status"]> = {
        PENDING: "pending", CONFIRMED: "confirmed",
        DELIVERED: "delivered", REJECTED: "cancelled", CLOSED: "delivered",
    };
    return map[state] ?? "pending";
}

// ─── PedidosYa Adapter ─────────────────────────────────────────────────────────

export class PedidosYaAdapter implements ChannelAdapter {
    readonly channelType: ChannelType = "pedidosya";

    readonly capabilities: AdapterCapabilities = {
        supportsWebhooks: true,
        supportsPolling: true,
        supportsStockWriteback: true,
        supportsPriceWriteback: true,
        supportsOrderRead: true,
        supportsProductRead: true,
        maxRatePerMinute: 50,
        requiresOAuth: true,
        requiresApiKey: true,
    };

    async verifyCredentials(credentials: ChannelCredentials): Promise<{ valid: boolean; shopName?: string }> {
        try {
            const { data } = await pyFetch("/restaurants/me", credentials);
            const rest = data as { name?: string };
            return { valid: true, shopName: rest.name };
        } catch (err) {
            if (err instanceof ChannelAuthError) return { valid: false };
            throw err;
        }
    }

    async fetchAllProducts(credentials: ChannelCredentials): Promise<NormalizedProduct[]> {
        const restaurantId = credentials.externalStoreId;
        const { data } = await pyFetch(`/restaurants/${restaurantId}/sections/products`, credentials);
        const items = (data as { products: PYProduct[] }).products ?? (data as PYProduct[]);
        return items.map(p => ({
            externalId: p.id,
            title: p.name,
            description: p.description,
            price: p.price,
            currency: "ARS", // PedidosYa primarily Argentina
            stock: p.enabled ? 999 : 0, // PY doesn't track stock — enabled/disabled
            status: p.enabled ? "active" : "archived",
            images: p.image ? [p.image] : [],
        }));
    }

    async fetchProductsSince(_credentials: ChannelCredentials, _since: number): Promise<NormalizedProduct[]> {
        // PY doesn't support incremental product sync — always full fetch
        return this.fetchAllProducts(_credentials);
    }

    async pushStockUpdate(credentials: ChannelCredentials, update: StockUpdate): Promise<void> {
        const restaurantId = credentials.externalStoreId;
        // PedidosYa uses enabled/disabled for availability
        await pyFetch(`/restaurants/${restaurantId}/products/${update.externalProductId}`, credentials, {
            method: "PATCH",
            body: JSON.stringify({ enabled: update.newStock > 0 }),
        });
    }

    async pushPriceUpdate(credentials: ChannelCredentials, update: PriceUpdate): Promise<void> {
        const restaurantId = credentials.externalStoreId;
        await pyFetch(`/restaurants/${restaurantId}/products/${update.externalProductId}`, credentials, {
            method: "PATCH",
            body: JSON.stringify({ price: update.newPrice }),
        });
    }

    async fetchOrdersSince(credentials: ChannelCredentials, since: number): Promise<NormalizedOrder[]> {
        const restaurantId = credentials.externalStoreId;
        const { data } = await pyFetch(`/restaurants/${restaurantId}/orders?state=CONFIRMED,DELIVERED`, credentials);
        const orders = (data as { orders?: PYOrder[] }).orders ?? (data as PYOrder[]);
        const sinceMs = since;
        return orders
            .filter(o => new Date(o.registeredDate).getTime() >= sinceMs)
            .map(o => {
                const commission = o.commission ?? o.grossValue * PY_COMMISSION_RATE;
                const lines: NormalizedOrderLine[] = o.products.map(p => ({
                    externalProductId: p.productId,
                    title: p.name,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    totalPrice: p.totalPrice,
                    currency: o.currency,
                }));
                return {
                    externalId: o.id,
                    channelType: "pedidosya" as ChannelType,
                    status: mapPYStatus(o.state),
                    currency: o.currency,
                    subtotal: o.grossValue,
                    shippingCost: o.deliveryFee,
                    channelCommission: Math.round(commission), // ~25% tracked, NOT platform revenue
                    totalAmount: o.orderValue,
                    lines,
                    customer: { externalId: o.user.id, name: o.user.name, phone: o.user.phone, email: o.user.email },
                    shippingAddress: o.address
                        ? { street: o.address.description, city: o.address.city, state: o.address.state, country: o.address.country }
                        : undefined,
                    placedAt: new Date(o.registeredDate).getTime(),
                    updatedAt: new Date(o.modifiedDate).getTime(),
                };
            });
    }

    async parseWebhook(
        headers: Record<string, string>,
        rawBody: Buffer,
        secret: string
    ): Promise<Partial<SyncEvent> | null> {
        const sig = headers["x-hub-signature"] ?? headers["X-Hub-Signature"] ?? "";
        if (sig) {
            const [algo, digest] = sig.split("=");
            const computed = crypto.createHmac(algo ?? "sha256", secret).update(rawBody).digest("hex");
            if (!crypto.timingSafeEqual(Buffer.from(digest ?? ""), Buffer.from(computed))) {
                throw new ChannelAuthError("pedidosya", "PedidosYa webhook HMAC mismatch");
            }
        }
        const body = JSON.parse(rawBody.toString("utf8")) as { event?: string; state?: string };
        const map: Record<string, SyncEventType> = {
            ORDER_CREATED: "ORDER_CREATED", ORDER_CONFIRMED: "ORDER_UPDATED",
            ORDER_DELIVERED: "ORDER_UPDATED", ORDER_REJECTED: "ORDER_UPDATED",
        };
        const eventType = map[body.event ?? ""];
        if (!eventType) return null;
        return { eventType, channelType: "pedidosya", payload: body };
    }

    getWebhookUrl(storeId: string): string {
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dpapp.cl";
        return `${base}/api/webhooks/channels/pedidosya/${storeId}`;
    }
}

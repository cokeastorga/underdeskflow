/**
 * OAuth Init Route — Redirect to external channel OAuth provider
 *
 * GET /api/channels/oauth/init?channel=mercadolibre&storeId=xxx
 *
 * Generates state param, stores in a short-lived Firestore document,
 * then redirects the user to the channel's OAuth authorization URL.
 *
 * Channels:
 *   - mercadolibre: https://auth.mercadolibre.cl/authorization
 *   - tiendanube:   https://www.tiendanube.com/apps/{appId}/authorize
 *   - shopify:      https://{shop}.myshopify.com/admin/oauth/authorize
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { ChannelType } from "@/types/channels";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dpapp.cl";

const OAUTH_CONFIGS: Record<string, {
    authUrl: (params: Record<string, string>) => string;
    scopes: string;
}> = {
    mercadolibre: {
        authUrl: ({ state }) =>
            `https://auth.mercadolibre.cl/authorization?response_type=code&client_id=${process.env.ML_APP_ID}&state=${state}&redirect_uri=${encodeURIComponent(`${APP_URL}/api/channels/oauth/callback`)}`,
        scopes: "offline_access read write",
    },
    tiendanube: {
        authUrl: ({ state }) =>
            `https://www.tiendanube.com/apps/${process.env.TN_APP_ID}/authorize?state=${state}&redirect_uri=${encodeURIComponent(`${APP_URL}/api/channels/oauth/callback`)}`,
        scopes: "read_products write_products read_orders",
    },
    shopify: {
        authUrl: ({ state, shopDomain }) =>
            `https://${shopDomain}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_APP_KEY}&scope=read_products,write_products,read_inventory,write_inventory,read_orders&redirect_uri=${encodeURIComponent(`${APP_URL}/api/channels/oauth/callback`)}&state=${state}`,
        scopes: "read_products,write_products,read_inventory,write_inventory,read_orders",
    },
};

export async function GET(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = req.nextUrl;
    const channel = searchParams.get("channel") as ChannelType;
    const storeId = searchParams.get("storeId");
    const shopDomain = searchParams.get("shopDomain") ?? "";

    if (!channel || !storeId) {
        return NextResponse.json({ error: "Missing channel or storeId" }, { status: 400 });
    }

    const config = OAUTH_CONFIGS[channel];
    if (!config) {
        return NextResponse.json({ error: `OAuth not supported for channel: ${channel}` }, { status: 400 });
    }

    // Generate a random state param and persist it for CSRF validation on callback
    const state = uuidv4();
    await adminDb.collection("oauth_states").doc(state).set({
        storeId,
        channelType: channel,
        shopDomain,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
    });

    const authUrl = config.authUrl({ state, shopDomain });
    return NextResponse.redirect(authUrl);
}

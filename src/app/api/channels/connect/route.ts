/**
 * Channel Connect API
 *
 * POST /api/channels/connect
 *
 * {
 *   storeId: string;
 *   channelType: ChannelType;
 *   credentials: {
 *     shopDomain?: string;
 *     apiKey?: string;
 *     accessToken?: string;
 *     externalStoreId?: string;
 *   };
 * }
 *
 * 1. Verifies the store has Enterprise feature
 * 2. Calls adapter.verifyCredentials()
 * 3. Creates ChannelConnection in Firestore (status: CONNECTED)
 * 4. Returns connectionId for the caller to trigger full sync
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { getAdapter } from "@/lib/channels/adapter.registry";
import { createChannelConnection } from "@/lib/channels/channel.repository";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { ChannelType, ChannelCredentials } from "@/types/channels";
import { verifyAuth } from "@/lib/firebase/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    const user = authHeader ? await verifyAuth(authHeader.replace("Bearer ", "")).catch(() => null) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
        storeId?: string;
        channelType?: ChannelType;
        credentials?: Partial<ChannelCredentials>;
    };
    const { storeId, channelType, credentials } = body;

    if (!storeId || !channelType || !credentials) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify store ownership
    const storeDoc = await adminDb.collection("stores").doc(storeId).get();
    if (!storeDoc.exists || storeDoc.data()?.ownerId !== user.uid) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check Enterprise feature
    const hasAccess = await isFeatureEnabled("ENTERPRISE_CHANNEL_SYNC", storeId);
    if (!hasAccess) {
        return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
    }

    // Verify credentials with the adapter
    let adapter;
    try {
        adapter = getAdapter(channelType);
    } catch {
        return NextResponse.json({ error: `Unsupported channel type: ${channelType}` }, { status: 400 });
    }

    const verification = await adapter.verifyCredentials(credentials as ChannelCredentials);
    if (!verification.valid) {
        return NextResponse.json({ error: "Invalid credentials — please verify your API keys." }, { status: 422 });
    }

    // Create the channel connection
    const connectionId = await createChannelConnection(storeId, {
        storeId,
        channelType,
        status: "CONNECTED",
        credentials: credentials as ChannelCredentials,
        syncConfig: {
            syncInventory: true,
            syncPrices: true,
            syncOrders: true,
            conflictResolution: "CENTRAL_WINS",
            pollingIntervalMinutes: 15,
        },
        retryCount: 0,
        connectedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        displayName: verification.shopName,
    });

    return NextResponse.json({ ok: true, connectionId, shopName: verification.shopName });
}

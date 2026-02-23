/**
 * Internal API — Push Stock Update to External Channel
 *
 * POST /api/internal/channels/stock-updates
 *
 * Called when a product's stock changes in the platform (order fulfilled, manual adjustment).
 * Enqueues the write-back to all connected channels for the store.
 *
 * Body:
 * {
 *   storeId: string;
 *   productId: string;         // Internal product ID
 *   externalProductId: string;
 *   channelConnectionId?: string; // If specified, push only to this channel
 *   newStock: number;
 *   reason?: string;
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { syncOrchestrator } from "@/lib/channels/sync.orchestrator";
import { listChannelConnections } from "@/lib/channels/channel.repository";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
        storeId?: string;
        productId?: string;
        externalProductId?: string;
        channelConnectionId?: string;
        newStock?: number;
        reason?: string;
    };
    const { storeId, productId, externalProductId, channelConnectionId, newStock } = body;

    if (!storeId || !productId || externalProductId === undefined || newStock === undefined) {
        return NextResponse.json({ error: "Missing required fields: storeId, productId, externalProductId, newStock" }, { status: 400 });
    }

    // Get all active connections for this store (or filter to specific connection)
    const connections = await listChannelConnections(storeId);
    const targets = channelConnectionId
        ? connections.filter(c => c.id === channelConnectionId && c.status !== "DISCONNECTED")
        : connections.filter(c => c.status === "ACTIVE" && c.syncConfig.syncInventory);

    const enqueued: string[] = [];
    for (const conn of targets) {
        await syncOrchestrator.enqueueWriteback({
            storeId,
            channelConnectionId: conn.id,
            productId,
            externalProductId,
            field: "stock",
            newValue: newStock,
            priority: "LOW", // Stock updates are batch / eventual consistent
        });
        enqueued.push(conn.id);
    }

    return NextResponse.json({ ok: true, enqueuedToConnections: enqueued });
}

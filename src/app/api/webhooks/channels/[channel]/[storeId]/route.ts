/**
 * Generic Webhook Receiver
 *
 * Handles POST /api/webhooks/[channel]/[storeId]
 *
 * For each channel:
 *   1. Read raw body (do NOT parse early — needed for HMAC)
 *   2. Look up the channel connection for the storeId
 *   3. Get the webhook secret from the connection credentials
 *   4. Delegate to the adapter parseWebhook() — it verifies HMAC and maps to SyncEvent
 *   5. If event is returned, store it in the sync_events outbox
 *   6. Trigger incremental sync if event is ORDER_CREATED / ORDER_UPDATED
 *
 * Returns 200 quickly to avoid webhook retries.
 * Heavy processing is async (enqueue + trigger).
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { getAdapter } from "@/lib/channels/adapter.registry";
import { enqueueSyncEvent, listChannelConnections } from "@/lib/channels/channel.repository";
import { syncOrchestrator } from "@/lib/channels/sync.orchestrator";
import { ChannelType } from "@/types/channels";

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ channel: string; storeId: string }> }
): Promise<NextResponse> {
    const { channel: channelParam, storeId } = await params;
    const channelType = channelParam as ChannelType;

    // Read raw body BEFORE any parsing (needed for HMAC verification)
    const rawBody = Buffer.from(await req.arrayBuffer());
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => { headers[key] = value; });

    try {
        // 1. Find the active channel connection for this store
        const connections = await listChannelConnections(storeId);
        const conn = connections.find(c => c.channelType === channelType && c.status !== "DISCONNECTED");
        if (!conn) {
            // Return 200 to prevent webhook retries (connection may have been removed)
            return NextResponse.json({ ok: true, message: "No active connection" });
        }

        // 2. Get adapter and parse/verify webhook
        const adapter = getAdapter(channelType);
        const secret = conn.credentials.webhookSecret ?? "";
        const syncEvent = await adapter.parseWebhook(headers, rawBody, secret);

        if (!syncEvent) {
            // Unknown or unsupported event type — acknowledge and ignore
            return NextResponse.json({ ok: true });
        }

        // 3. Enqueue the sync event in the Firestore outbox
        const eventId = await enqueueSyncEvent(storeId, conn.id, {
            storeId,
            channelConnectionId: conn.id,
            channelType,
            eventType: syncEvent.eventType!,
            priority: syncEvent.priority ?? "MEDIUM",
            status: "PENDING",
            payload: syncEvent.payload as Record<string, unknown>,
            maxRetries: 3,
            traceId: headers["x-request-id"] ?? headers["x-trace-id"] ?? crypto.randomUUID(),
        });

        // 4. For high-priority order events, trigger an incremental sync immediately (async)
        const orderEvents = new Set(["ORDER_CREATED", "ORDER_UPDATED", "REFUND_ISSUED"]);
        if (orderEvents.has(syncEvent.eventType!)) {
            // Non-blocking: fire and forget — full error handling in orchestrator
            syncOrchestrator.runIncrementalSync(storeId, conn.id).catch(err => {
                console.error(`[webhook] Incremental sync failed for ${storeId}/${conn.id}:`, err);
            });
        }

        return NextResponse.json({ ok: true, eventId });
    } catch (err) {
        // Auth errors (bad HMAC) → 401
        const isAuthError = err instanceof Error && err.name === "ChannelAuthError";
        if (isAuthError) {
            return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
        }
        // All other errors → 200 with logged error (prevents channel from retrying endlessly)
        console.error(`[webhook][${channelType}][${storeId}]`, err);
        return NextResponse.json({ ok: true });
    }
}

/**
 * Internal API — Trigger Channel Sync
 *
 * POST /api/internal/channels/sync
 *
 * Used by:
 *   - Vercel Cron Jobs (polling schedule per connection)
 *   - Admin tools (manual trigger)
 *
 * Body: { storeId: string; connectionId: string; mode: "full" | "incremental" }
 *
 * Authentication: INTERNAL_API_SECRET header or Vercel Cron Authorization header.
 * This endpoint is NOT customer-facing.
 */

import { NextRequest, NextResponse } from "next/server";
import { syncOrchestrator } from "@/lib/channels/sync.orchestrator";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Verify internal auth
    const authHeader = req.headers.get("Authorization");
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const cronSecret = process.env.CRON_SECRET;

    const isInternalCall = internalSecret && authHeader === `Bearer ${internalSecret}`;
    const isCronCall = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isInternalCall && !isCronCall) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
        storeId?: string;
        connectionId?: string;
        mode?: "full" | "incremental";
    };

    const { storeId, connectionId, mode = "incremental" } = body;
    if (!storeId || !connectionId) {
        return NextResponse.json({ error: "storeId and connectionId required" }, { status: 400 });
    }

    // Verify the store has Enterprise feature enabled
    const hasAccess = await isFeatureEnabled("ENTERPRISE_CHANNEL_SYNC", storeId);
    if (!hasAccess) {
        return NextResponse.json({ error: "Feature not available on current plan" }, { status: 403 });
    }

    const result = mode === "full"
        ? await syncOrchestrator.runFullSync(storeId, connectionId)
        : await syncOrchestrator.runIncrementalSync(storeId, connectionId);

    return NextResponse.json({ ok: true, result });
}

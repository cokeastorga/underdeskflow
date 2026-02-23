/**
 * Internal Outbox Trigger — POST /api/internal/outbox/process
 * 
 * Secure endpoint to trigger the processing of staged outbox events.
 * Intended to be called by a cron job or background scheduler.
 */

import { NextRequest, NextResponse } from "next/server";
import { outboxWorker } from "@/lib/channels/outbox-worker";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Basic shared secret check for internal security
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.INTERNAL_API_SECRET;

    if (secret && authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const stats = await outboxWorker.processPending();
        return NextResponse.json({
            success: true,
            ...stats,
            timestamp: Date.now()
        });
    } catch (error: any) {
        console.error("Outbox process error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

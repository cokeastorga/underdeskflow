import { NextRequest, NextResponse } from "next/server";
import { reconcileStalePayments } from "@/workers/reconciliation/payments";
import { logger } from "@/lib/logger";

/**
 * GET /api/internal/cron/reconcile
 * Secure cron endpoint intended to be fired every 20-30 mins by Cloud Scheduler or Vercel Cron.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    
    // In production, enforce an environment secret to prevent abuse of the reconciliation engine
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        logger.warn("Unauthorized attempt to trigger PSP Reconciliation Cron", { authHeader });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await reconcileStalePayments();
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        logger.error("Reconciliation Cron Failed", { error: error.message });
        return NextResponse.json({ error: "Reconciliation Failed", details: error.message }, { status: 500 });
    }
}

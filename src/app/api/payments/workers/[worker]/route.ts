/**
 * Worker Trigger Routes
 *
 * These routes are meant to be called by Cloud Scheduler (not browsers).
 * They are protected by a shared secret to prevent unauthorized triggers.
 *
 * Cloud Scheduler config:
 *   Outbox:         POST /api/payments/workers/outbox   (every 30s)
 *   Reconciliation: POST /api/payments/workers/reconcile (every 5min)
 */
import { NextRequest, NextResponse } from "next/server";
import { runOutboxWorker } from "@/lib/payments/workers/outbox.worker";
import { runReconciliationWorker } from "@/lib/payments/workers/reconciliation.worker";

function verifyWorkerSecret(request: NextRequest): boolean {
    const secret = process.env.WORKER_SECRET;
    if (!secret) return process.env.NODE_ENV !== "production"; // Allow in dev without secret
    const provided = request.headers.get("x-worker-secret");
    return provided === secret;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ worker: string }> }
): Promise<NextResponse> {
    if (!verifyWorkerSecret(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { worker } = await params;

    try {
        if (worker === "outbox") {
            const result = await runOutboxWorker();
            return NextResponse.json({ ok: true, ...result });
        }

        if (worker === "reconcile") {
            await runReconciliationWorker();
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ error: "Unknown worker" }, { status: 404 });
    } catch (err) {
        console.error(`[Worker:${worker}] Unhandled error`, err);
        return NextResponse.json({ error: "Worker failed" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { runReconciliationWorker } from "@/lib/payments/workers/reconciliation.worker";
import { adminAuth } from "@/lib/firebase/admin-config";

/**
 * GET /api/payments/reconcile
 * Trigger for the reconciliation jobs.
 * 
 * In production, this should be called by a CRON job (e.g. Vercel Cron or GitHub Action).
 * We protect it via Admin Secret or Admin SDK token.
 */
export async function GET(req: NextRequest) {
    try {
        // Simple protection: check for Authorization header with admin token
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];

        // Use a static admin secret for simplicity in this demo or verify with Firebase Admin
        const ADMIN_SECRET = process.env.PAYMENTS_ADMIN_SECRET;

        if (token !== ADMIN_SECRET) {
            // Alternatively, verify as Firebase ID Token and check admin claim
            try {
                const decoded = await adminAuth.verifyIdToken(token);
                if (!decoded.admin) throw new Error("Not an admin");
            } catch (authErr) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }
        }

        // Run reconciliation asynchronously — don't block the HTTP response
        runReconciliationWorker().catch(err => console.error("Reconciliation worker error:", err));

        return NextResponse.json({
            status: "accepted",
            message: "Reconciliation run started in background.",
            timestamp: Date.now()
        });

    } catch (err) {
        console.error("Reconcile API error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

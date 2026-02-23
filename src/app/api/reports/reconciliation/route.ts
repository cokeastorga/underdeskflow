/**
 * Reports API — Reconciliation
 *
 * GET /api/reports/reconciliation
 *
 * Query params:
 *   storeId  — string (required)
 *   from     — timestamp ms or ISO date (optional; generates new run if provided with to)
 *   to       — timestamp ms or ISO date (optional)
 *   history  — boolean; if true returns list of past runs (default: false)
 *
 * Auth: Firebase ID token
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import {
    generateReconciliationRun,
    getReconciliationHistory,
} from "@/lib/payments/reporting.service";
import { ReportingPeriod } from "@/types/payments";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const storeId = searchParams.get("storeId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const history = searchParams.get("history") === "true";

    if (!storeId) return NextResponse.json({ error: "Missing storeId" }, { status: 400 });

    // Return history of previous reconciliation runs
    if (history) {
        const runs = await getReconciliationHistory(storeId);
        return NextResponse.json({ runs });
    }

    // Generate a new reconciliation run for the given period
    if (!fromParam || !toParam) {
        return NextResponse.json(
            { error: "Provide from & to params to generate a reconciliation run, or history=true to list past runs" },
            { status: 400 }
        );
    }

    const period: ReportingPeriod = {
        start: Number.isNaN(Number(fromParam)) ? new Date(fromParam).getTime() : Number(fromParam),
        end: Number.isNaN(Number(toParam)) ? new Date(toParam).getTime() : Number(toParam),
    };

    const run = await generateReconciliationRun(storeId, period);
    return NextResponse.json({ run });
}

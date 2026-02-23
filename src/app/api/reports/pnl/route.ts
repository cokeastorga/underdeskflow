/**
 * Reports API — P&L
 *
 * GET /api/reports/pnl
 *
 * Query params:
 *   storeId  — string (required)
 *   from     — ISO date or timestamp ms (required)
 *   to       — ISO date or timestamp ms (required)
 *   groupBy  — "day" | "week" | "month" (default: month)
 *   channel  — boolean flag; include per-channel breakdown (Enterprise)
 *   format   — "json" | "csv" (default: json)
 *
 * Auth: Firebase ID token in Authorization header
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
    generatePnLReport,
    generateChannelPnLReport,
    exportPnLReportAsCSV,
} from "@/lib/payments/reporting.service";
import { PnLGroupBy } from "@/types/reporting";
import { ReportingPeriod } from "@/types/payments";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
    // Auth
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const storeId = searchParams.get("storeId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const groupBy = (searchParams.get("groupBy") ?? "month") as PnLGroupBy;
    const includeChannel = searchParams.get("channel") === "true";
    const format = searchParams.get("format") ?? "json";

    if (!storeId || !fromParam || !toParam) {
        return NextResponse.json({ error: "Missing required params: storeId, from, to" }, { status: 400 });
    }

    const period: ReportingPeriod = {
        start: Number.isNaN(Number(fromParam)) ? new Date(fromParam).getTime() : Number(fromParam),
        end: Number.isNaN(Number(toParam)) ? new Date(toParam).getTime() : Number(toParam),
    };

    if (period.start >= period.end) {
        return NextResponse.json({ error: "'from' must be before 'to'" }, { status: 400 });
    }

    // Generate P&L
    const pnlReport = await generatePnLReport(storeId, period, groupBy);

    // Channel breakdown (Enterprise only)
    let channelReport = null;
    if (includeChannel) {
        const hasEnterprise = await isFeatureEnabled("ENTERPRISE_CHANNEL_SYNC", storeId);
        if (hasEnterprise) {
            channelReport = await generateChannelPnLReport(storeId, period);
        }
    }

    // CSV export
    if (format === "csv") {
        const csv = exportPnLReportAsCSV(pnlReport);
        const filename = `pnl_${storeId}_${period.start}_${period.end}.csv`;
        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    }

    return NextResponse.json({
        pnl: pnlReport,
        ...(channelReport ? { channels: channelReport } : {}),
    });
}

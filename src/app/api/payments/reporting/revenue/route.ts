import { NextRequest, NextResponse } from "next/server";
import { generateTenantRevenueReport } from "@/lib/payments/reporting";
import { ReportingPeriod, OrchestratorError } from "@/types/payments";
import { adminAuth } from "@/lib/firebase/admin-config";

/**
 * GET /api/payments/reporting/revenue
 *
 * Query params:
 *   - storeId: string
 *   - start:   number (timestamp ms)
 *   - end:     number (timestamp ms)
 *
 * Operations:
 * 1. Authenticate operator
 * 2. Validate period
 * 3. Generate technical report from Ledger + Intents
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId");
        const start = parseInt(searchParams.get("start") || "0");
        const end = parseInt(searchParams.get("end") || Date.now().toString());

        if (!storeId) {
            return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
        }

        // 1. Auth check (Basic admin check)
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        await adminAuth.verifyIdToken(token);
        // TODO: Verify if user has access to this specific storeId

        // 2. Generate report
        const period: ReportingPeriod = { start, end };
        const report = await generateTenantRevenueReport(storeId, period);

        return NextResponse.json(report);

    } catch (err) {
        console.error("[ReportingAPI] Error:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

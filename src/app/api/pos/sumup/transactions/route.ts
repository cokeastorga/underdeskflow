import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

import { getSecret } from "@/lib/secrets";
import { SumUpService } from "@/lib/services/sumup";

/**
 * GET /api/pos/sumup/transactions?storeId=...&limit=20&offset=0
 * Returns paginated SumUp transaction history using key from Secret Manager.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
        const offset = parseInt(searchParams.get("offset") ?? "0");

        if (!storeId) {
            return NextResponse.json({ error: "storeId required" }, { status: 400 });
        }

        // Check if SumUp is connected
        const metaSnap = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("integrations")
            .doc("sumup")
            .get();

        if (!metaSnap.exists || !metaSnap.data()?.enabled) {
            return NextResponse.json({ error: "SumUp not connected" }, { status: 404 });
        }

        // Get key from Secret Manager
        const apiKey = await getSecret(`sumup_${storeId}_apikey`);
        if (!apiKey) {
            return NextResponse.json({ error: "SumUp API key not found" }, { status: 404 });
        }

        const service = new SumUpService(apiKey);
        const result = await service.getTransactions(limit, offset);

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("[SumUp Transactions Error]", err);
        return NextResponse.json({ error: err.message ?? "Internal Server Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { OrderFulfillment } from "@/domains/fulfillment/types";

/**
 * GET /api/fulfillments?storeId=&status=
 * Returns all fulfillments for a given store, optionally filtered by status.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        const status = searchParams.get("status");

        if (!storeId) {
            return NextResponse.json({ error: "storeId required" }, { status: 400 });
        }

        let query = adminDb.collection("order_fulfillments")
            .where("storeId", "==", storeId)
            .orderBy("createdAt", "desc")
            .limit(100);

        if (status) {
            query = adminDb.collection("order_fulfillments")
                .where("storeId", "==", storeId)
                .where("status", "==", status)
                .orderBy("createdAt", "desc")
                .limit(100) as any;
        }

        const snap = await query.get();
        const fulfillments = snap.docs.map(d => d.data() as OrderFulfillment);
        return NextResponse.json({ fulfillments });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

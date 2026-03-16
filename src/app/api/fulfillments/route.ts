import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { OrderFulfillment } from "@/domains/fulfillment/types";

/**
 * GET /api/fulfillments?storeId=&status=&branchId=
 * Returns fulfillments for a given store.
 *   - status:   optional single-status filter
 *   - branchId: optional branch filter ("ALL" or empty = all branches)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId  = searchParams.get("storeId");
        const status   = searchParams.get("status");
        const branchId = searchParams.get("branchId"); // NEW

        if (!storeId) {
            return NextResponse.json({ error: "storeId required" }, { status: 400 });
        }

        // Build the base query — always scope by storeId
        let baseRef = adminDb.collection("order_fulfillments")
            .where("storeId", "==", storeId) as FirebaseFirestore.Query;

        if (status) {
            baseRef = baseRef.where("status", "==", status);
        }

        // Branch filter: only apply if a concrete branchId is provided (not "ALL" / empty)
        if (branchId && branchId !== "ALL") {
            baseRef = baseRef.where("branchId", "==", branchId);
        }

        const snap = await baseRef.orderBy("createdAt", "desc").limit(100).get();
        const fulfillments = snap.docs.map(d => d.data() as OrderFulfillment);

        return NextResponse.json({ fulfillments });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

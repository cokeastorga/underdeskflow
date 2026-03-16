import { NextRequest, NextResponse } from "next/server";
import { transferStock } from "@/domains/inventory/services.server";

/**
 * POST /api/inventory/transfer
 * Body: { storeId, variantId, fromBranchId, toBranchId, quantity, userId }
 *
 * Atomically moves stock between two branches via TRANSFER_OUT + TRANSFER_IN.
 * If the source branch lacks sufficient stock the entire operation rolls back.
 */
export async function POST(req: NextRequest) {
    try {
        const { storeId, variantId, fromBranchId, toBranchId, quantity, userId } = await req.json();

        if (!storeId || !variantId || !fromBranchId || !toBranchId || !quantity || !userId) {
            return NextResponse.json(
                { error: "storeId, variantId, fromBranchId, toBranchId, quantity, userId are required" },
                { status: 400 }
            );
        }

        if (fromBranchId === toBranchId) {
            return NextResponse.json({ error: "Source and destination branch must be different" }, { status: 400 });
        }

        if (quantity <= 0) {
            return NextResponse.json({ error: "quantity must be > 0" }, { status: 400 });
        }

        const result = await transferStock(storeId, variantId, fromBranchId, toBranchId, quantity, userId);

        return NextResponse.json({
            success: true,
            transferOut: result.out,
            transferIn: result.into,
        }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

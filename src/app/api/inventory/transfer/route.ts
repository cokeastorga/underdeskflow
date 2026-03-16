import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import { transferStock } from "@/domains/inventory/services.server";

/**
 * POST /api/inventory/transfer
 * Headers: Authorization: Bearer <firebase_id_token>
 * Body: { storeId, variantId, fromLocationId, toLocationId, quantity, note? }
 *
 * Atomically moves stock via TRANSFER_OUT + TRANSFER_IN.
 * If source lacks sufficient stock the entire Firestore transaction rolls back.
 */
export async function POST(req: NextRequest) {
    try {
        // ── Auth guard ──────────────────────────────────────────────────
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await verifyAuth(token);

        // ── Parse & validate body ────────────────────────────────────────
        const body = await req.json();
        const { storeId, variantId, fromLocationId, toLocationId, quantity, note } = body;

        if (!storeId || !variantId || !fromLocationId || !toLocationId || !quantity) {
            return NextResponse.json(
                { error: "storeId, variantId, fromLocationId, toLocationId, quantity son requeridos" },
                { status: 400 }
            );
        }

        if (fromLocationId === toLocationId) {
            return NextResponse.json(
                { error: "El origen y destino no pueden ser el mismo" },
                { status: 400 }
            );
        }

        const qty = Number(quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
            return NextResponse.json(
                { error: "La cantidad debe ser un número positivo" },
                { status: 400 }
            );
        }

        // ── Execute atomic transfer ─────────────────────────────────────
        const result = await transferStock(
            storeId,
            variantId,
            fromLocationId,
            toLocationId,
            qty,
            user.uid,
            note
        );

        return NextResponse.json({
            success: true,
            transferOut: result.out,
            transferIn: result.into,
        }, { status: 201 });

    } catch (err: any) {
        // Surface domain errors (e.g. insufficient stock) as 400
        return NextResponse.json({ error: err.message ?? "Error interno al transferir" }, { status: 400 });
    }
}

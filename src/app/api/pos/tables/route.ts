import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin-config";
import { FieldValue } from "firebase-admin/firestore";

/**
 * GET /api/pos/tables?storeId=...
 * Returns all tables for the store with their current order status.
 *
 * POST /api/pos/tables
 * { storeId, name, seats?, section? }
 * Creates a new table definition.
 */

export interface TableDoc {
    id: string;
    storeId: string;
    name: string;        // "Mesa 1", "Barra A", etc.
    seats: number;
    section?: string;    // "Terraza", "Interior", etc.
    status: "free" | "occupied" | "needs_attention" | "reserved" | "closed";
    currentOrderId?: string;
    openedAt?: FirebaseFirestore.Timestamp;
    openedByUid?: string;
    openedByName?: string;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
}

async function verifyAuth(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");
    return adminAuth.verifyIdToken(token);
}

// ── GET — list all tables ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

        await verifyAuth(req);

        const snap = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("tables")
            .orderBy("name")
            .get();

        const tables = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return NextResponse.json(tables);
    } catch (err: any) {
        console.error("[Tables GET]", err);
        return NextResponse.json({ error: err.message }, { status: err.message === "Unauthorized" ? 401 : 500 });
    }
}

// ── POST — create table ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        await verifyAuth(req);
        const body = await req.json();
        const { storeId, name, seats = 4, section } = body;

        if (!storeId || !name) {
            return NextResponse.json({ error: "storeId and name are required" }, { status: 400 });
        }

        const now = FieldValue.serverTimestamp();
        const ref = adminDb.collection("stores").doc(storeId).collection("tables").doc();
        const table: Omit<TableDoc, "id"> = {
            storeId,
            name,
            seats,
            ...(section ? { section } : {}),
            status: "free",
            createdAt: now as any,
            updatedAt: now as any,
        };

        await ref.set(table);
        return NextResponse.json({ id: ref.id, ...table });
    } catch (err: any) {
        console.error("[Tables POST]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── DELETE — remove table ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        await verifyAuth(req);
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        const tableId = searchParams.get("tableId");

        if (!storeId || !tableId) {
            return NextResponse.json({ error: "storeId and tableId required" }, { status: 400 });
        }

        await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("tables")
            .doc(tableId)
            .delete();

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[Tables DELETE]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

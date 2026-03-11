import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin-config";
import { FieldValue } from "firebase-admin/firestore";

/**
 * /api/pos/tables/[tableId]
 *
 * GET    → table metadata + current open order summary
 * PATCH  → update table state:
 *    action: "open"    → open table (create order), assign cashier
 *    action: "addItem" → add item to current order
 *    action: "close"   → close order, mark table free + calculate total
 *    action: "cancel"  → void current order, mark table free
 *    action: "status"  → set arbitrary status ("needs_attention", "reserved")
 * DELETE → see tables/route.ts
 */

async function verifyAuth(req: NextRequest) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");
    return adminAuth.verifyIdToken(token);
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ tableId: string }> }
) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
        await verifyAuth(req);

        const { tableId } = await params;
        const tableSnap = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("tables")
            .doc(tableId)
            .get();

        if (!tableSnap.exists) {
            return NextResponse.json({ error: "Table not found" }, { status: 404 });
        }

        const table = { id: tableSnap.id, ...tableSnap.data() };
        let order = null;

        // Fetch current open order if any
        const tableData = tableSnap.data()!;
        if (tableData.currentOrderId) {
            const orderSnap = await adminDb
                .collection("stores")
                .doc(storeId)
                .collection("orders")
                .doc(tableData.currentOrderId)
                .get();
            if (orderSnap.exists) {
                order = { id: orderSnap.id, ...orderSnap.data() };
            }
        }

        return NextResponse.json({ table, order });
    } catch (err: any) {
        console.error("[Table GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ tableId: string }> }
) {
    try {
        const decoded = await verifyAuth(req);
        const body = await req.json();
        const { tableId } = await params;
        const { storeId, action, items, discount, paymentMethod, notes, status } = body;

        if (!storeId || !action) {
            return NextResponse.json({ error: "storeId and action required" }, { status: 400 });
        }

        const tableRef = adminDb
            .collection("stores")
            .doc(storeId)
            .collection("tables")
            .doc(tableId);

        const tableSnap = await tableRef.get();
        if (!tableSnap.exists) {
            return NextResponse.json({ error: "Table not found" }, { status: 404 });
        }

        const tableData = tableSnap.data()!;
        const now = FieldValue.serverTimestamp();

        // ── Open table ────────────────────────────────────────────────────────
        if (action === "open") {
            if (tableData.status === "occupied") {
                return NextResponse.json({ error: "Table is already occupied" }, { status: 409 });
            }

            const orderRef = adminDb.collection("stores").doc(storeId).collection("orders").doc();
            const batch = adminDb.batch();

            const order = {
                id: orderRef.id,
                channel: "pos",
                locationId: tableData.locationId || "default", // If available later 
                status: "open",
                paymentStatus: "pending",
                fulfillmentStatus: "preparing",
                totals: {
                    subtotal: 0,
                    discount: discount ?? 0,
                    tax: 0,
                    total: 0
                },
                items: items ?? [],
                tableId,
                tableName: tableData.name,
                notes: notes ?? "",
                audit: {
                    createdBy: decoded.uid,
                    cashierName: decoded.name ?? decoded.email ?? "Staff"
                },
                createdAt: now,
                updatedAt: now,
            };

            batch.set(orderRef, order);
            batch.update(tableRef, {
                status: "occupied",
                currentOrderId: orderRef.id,
                openedAt: now,
                openedByUid: decoded.uid,
                openedByName: decoded.name ?? decoded.email,
                updatedAt: now,
            });

            await batch.commit();
            return NextResponse.json({ tableId, orderId: orderRef.id, status: "occupied" });
        }

        // ── Add items to existing order ───────────────────────────────────────
        if (action === "addItem") {
            if (!tableData.currentOrderId) {
                return NextResponse.json({ error: "No open order on this table" }, { status: 400 });
            }
            if (!items || !Array.isArray(items)) {
                return NextResponse.json({ error: "items required" }, { status: 400 });
            }

            const orderRef = adminDb
                .collection("stores")
                .doc(storeId)
                .collection("orders")
                .doc(tableData.currentOrderId);

            const orderSnap = await orderRef.get();
            if (!orderSnap.exists) {
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }

            const existingItems: any[] = orderSnap.data()!.items ?? [];

            // Merge: if item already in order, increase quantity
            const merged = [...existingItems];
            for (const newItem of items) {
                const existing = merged.find((i) => i.productId === newItem.productId);
                if (existing) {
                    existing.quantity += newItem.quantity;
                } else {
                    merged.push(newItem);
                }
            }

            // Recalculate total
            const subtotal = merged.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
            const discountAmount = orderSnap.data()!.totals?.discount ?? 0;
            const total = Math.max(0, subtotal - discountAmount);

            await orderRef.update({ 
                items: merged, 
                "totals.subtotal": subtotal, 
                "totals.total": total, 
                fulfillmentStatus: "preparing", // Reset kitchen status
                updatedAt: now 
            });

            return NextResponse.json({ orderId: tableData.currentOrderId, items: merged, total });
        }

        // ── Close table / Pay ─────────────────────────────────────────────────
        if (action === "close") {
            if (!tableData.currentOrderId) {
                return NextResponse.json({ error: "No open order" }, { status: 400 });
            }

            const orderRef = adminDb
                .collection("stores")
                .doc(storeId)
                .collection("orders")
                .doc(tableData.currentOrderId);

            const orderSnap = await orderRef.get();
            if (!orderSnap.exists) {
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }

            const orderData = orderSnap.data()!;
            const subtotal = (orderData.items ?? []).reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
            const discountAmount = orderData.totals?.discount ?? 0;
            const finalTotal = Math.max(0, subtotal - discountAmount);

            const batch = adminDb.batch();

            // 1. Update Order
            batch.update(orderRef, {
                status: "completed",
                paymentStatus: "paid",
                "totals.total": finalTotal,
                "totals.subtotal": subtotal,
                updatedAt: now,
            });

            // 2. Create Payment Entity
            const paymentRef = adminDb.collection("stores").doc(storeId).collection("payments").doc();
            batch.set(paymentRef, {
                id: paymentRef.id,
                orderId: orderRef.id,
                method: paymentMethod ?? "cash",
                amount: finalTotal,
                status: "completed",
                createdAt: now
            });

            // 3. Free the table
            batch.update(tableRef, {
                status: "free",
                currentOrderId: FieldValue.delete(),
                openedAt: FieldValue.delete(),
                openedByUid: FieldValue.delete(),
                openedByName: FieldValue.delete(),
                updatedAt: now,
            });

            await batch.commit();
            return NextResponse.json({ orderId: tableData.currentOrderId, total: finalTotal, status: "closed" });
        }

        // ── Cancel / Void ─────────────────────────────────────────────────────
        if (action === "cancel") {
            const batch = adminDb.batch();

            if (tableData.currentOrderId) {
                const orderRef = adminDb
                    .collection("stores")
                    .doc(storeId)
                    .collection("orders")
                    .doc(tableData.currentOrderId);
                batch.update(orderRef, { status: "cancelled", updatedAt: now });
            }

            batch.update(tableRef, {
                status: "free",
                currentOrderId: FieldValue.delete(),
                openedAt: FieldValue.delete(),
                openedByUid: FieldValue.delete(),
                openedByName: FieldValue.delete(),
                updatedAt: now,
            });

            await batch.commit();
            return NextResponse.json({ success: true, status: "freed" });
        }

        // ── Set arbitrary status ──────────────────────────────────────────────
        if (action === "status") {
            const allowed = ["free", "occupied", "needs_attention", "reserved", "closed"];
            if (!allowed.includes(status)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
            await tableRef.update({ status, updatedAt: now });
            return NextResponse.json({ tableId, status });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (err: any) {
        console.error("[Table PATCH]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

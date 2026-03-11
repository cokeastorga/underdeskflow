import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { Product } from "@/types";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

/** POST /api/pos/sale
 *
 * Idempotent sale recording for POS terminal.
 * Uses clientSaleId (uuid-v4) to prevent duplicate orders on offline retries.
 */
export async function POST(req: NextRequest) {
    try {
        const {
            clientSaleId,
            storeId,
            items,
            paymentMethod,
            discount = 0,
            cashSessionId,
        } = await req.json();

        if (!clientSaleId || !storeId || !items?.length || !paymentMethod) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ── Idempotency check ──────────────────────────────────────────────────
        const idxRef = adminDb.collection("pos_sale_index").doc(clientSaleId);
        const idxSnap = await idxRef.get();
        if (idxSnap.exists) {
            // Already created — return the existing order (safe for retries)
            const existingOrderId = idxSnap.data()!.orderId;
            const existingOrder = await adminDb
                .collection("stores")
                .doc(storeId)
                .collection("orders")
                .doc(existingOrderId)
                .get();
            return NextResponse.json({ orderId: existingOrderId, order: existingOrder.data(), duplicate: true });
        }

        // ── Stock validation ───────────────────────────────────────────────────
        const storeRef = adminDb.collection("stores").doc(storeId);
        for (const item of items) {
            const productSnap = await storeRef.collection("products").doc(item.productId).get();
            if (!productSnap.exists) {
                return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 422 });
            }
            const product = productSnap.data()!;
            if ((product.stock ?? 0) < item.qty) {
                return NextResponse.json(
                    { error: `Insufficient stock for "${product.name}". Available: ${product.stock}` },
                    { status: 422 }
                );
            }
        }

        // ── Calculate totals ───────────────────────────────────────────────────
        const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.qty, 0);
        const total = Math.max(0, subtotal - discount);

        // ── Create order ───────────────────────────────────────────────────────
        const now = Timestamp.now();
        const orderRef = storeRef.collection("orders").doc();
        const paymentRef = storeRef.collection("payments").doc();

        const orderData = {
            id: orderRef.id,
            channel: "pos",
            status: "completed",
            paymentStatus: "paid", // POS sales are paid instantly usually
            fulfillmentStatus: "delivered", // Instant delivery on physical POS
            totals: {
                subtotal,
                discount,
                tax: 0, // Simplified for now
                total
            },
            items: items.map((i: any) => ({
                productId: i.productId,
                name: i.name,
                price: i.price,
                quantity: i.qty,
            })),
            audit: {
                createdBy: "pos_system",
                idempotencyKey: clientSaleId
            },
            createdAt: now,
            updatedAt: now,
        };

        const paymentData = {
            id: paymentRef.id,
            orderId: orderRef.id,
            method: paymentMethod,
            amount: total,
            status: "completed",
            createdAt: now
        };

        // ── Execute everything inside an Admin Transaction ─────────────────────
        await adminDb.runTransaction(async (transaction) => {
            // 1. Read all products first to get current stock and calculate balanceAfter
            const productRefs = items.map((i: any) => storeRef.collection("products").doc(i.productId));
            const productSnaps = await transaction.getAll(...productRefs);

            const inventoryUpdates = [];
            const inventoryMovements = [];

            for (let i = 0; i < productSnaps.length; i++) {
                const snap = productSnaps[i];
                const item = items[i];

                if (!snap.exists) continue; // Skip or throw, depending on strictness
                
                const productData = snap.data() as Product;
                const currentStock = productData?.stock || 0;
                const balanceAfter = Math.max(0, currentStock - item.qty);

                inventoryUpdates.push({
                    ref: snap.ref,
                    data: { stock: balanceAfter, updatedAt: now }
                });

                const movementRef = storeRef.collection("inventory_movements").doc();
                inventoryMovements.push({
                    ref: movementRef,
                    data: {
                        id: movementRef.id,
                        productId: item.productId,
                        locationId: "default", // Later: locationId from payload
                        storeId,
                        type: "sale" as const,
                        quantity: -item.qty,
                        balanceAfter,
                        referenceId: orderRef.id,
                        actor: "pos_system",
                        notes: `POS Sale`,
                        timestamp: now.toMillis()
                    }
                });
            }

            // 2. Perform all writes
            transaction.set(orderRef, orderData);
            transaction.set(paymentRef, paymentData);
            transaction.set(idxRef, { orderId: orderRef.id, storeId, createdAt: now });

            // Apply inventory updates
            for (const update of inventoryUpdates) {
                transaction.update(update.ref, update.data);
            }

            // Create inventory movements
            for (const mov of inventoryMovements) {
                transaction.set(mov.ref, mov.data);
            }

            // Ledger entries
            const ledgerRef = adminDb.collection("ledger_transactions").doc();
            transaction.set(ledgerRef, {
                reference_id: orderRef.id,
                storeId,
                type: "pos_sale",
                createdAt: now,
                entries: [
                    { account: "cash_account", type: "debit", amount: total },
                    { account: "sales_revenue", type: "credit", amount: total },
                ],
            });

            // Update cash session
            if (cashSessionId && paymentMethod === "cash") {
                const sessionRef = storeRef.collection("cash_sessions").doc(cashSessionId);
                transaction.update(sessionRef, {
                    totalSales: FieldValue.increment(total),
                    saleCount: FieldValue.increment(1),
                    updatedAt: now,
                });
            }

            // Analytics daily
            const today = new Date().toISOString().slice(0, 10);
            const analyticsRef = adminDb.collection("analytics_daily").doc(`${storeId}_${today}`);
            transaction.set(
                analyticsRef,
                {
                    storeId,
                    date: today,
                    pos_sales_count: FieldValue.increment(1),
                    pos_sales_amount: FieldValue.increment(total),
                    updatedAt: now,
                },
                { merge: true }
            );
        });

        return NextResponse.json({ success: true, orderId: orderRef.id }, { status: 201 });
    } catch (error: any) {
        console.error("Sale Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

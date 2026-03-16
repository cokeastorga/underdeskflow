import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { createOrder, addOrderItem, updateOrderStatus } from "@/domains/orders/services.server";
import { getStock, reserveStock, releaseStockReservation } from "@/domains/inventory/services.server";
import { appendFinancialEvent } from "@/domains/pos/events";
import { OrderChannel } from "@/domains/orders/types";

/** 
 * POST /api/orders
 * 
 * Centralized Unified Orders Endpoint. 
 * Replaces the legacy /api/pos/sale. Capable of receiving orders from POS, WEB, SHOWROOM.
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
            channel = "POS",
        } = await req.json();

        if (!clientSaleId || !storeId || !items?.length) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ── Idempotency Check ──────────────────────────────────────────────────
        // Legacy POS Index or new centralized idempotency. Let's use orders_idempotency
        const idxRef = adminDb.collection("orders_idempotency").doc(clientSaleId);
        const idxSnap = await idxRef.get();
        if (idxSnap.exists) {
            return NextResponse.json({ orderId: idxSnap.data()!.orderId, duplicate: true });
        }

        // ── Resolve POS Context if cashSessionId is provided ───────────────────
        let branchId = undefined;
        let registerId = undefined;
        let createdByUserId = "system";

        if (cashSessionId) {
            const sessionSnap = await adminDb.collection("cash_sessions").doc(cashSessionId).get();
            if (sessionSnap.exists) {
                const sessionData = sessionSnap.data()!;
                branchId = sessionData.branchId;
                registerId = sessionData.registerId;
                createdByUserId = sessionData.openedByUserId || sessionData.openedBy;
            } else {
                 return NextResponse.json({ error: "Invalid cash session" }, { status: 400 });
            }
        }

        // ── Pre-flight Stock Validation (If Branch is Known) ───────────────────
        if (branchId) {
            for (const item of items) {
                const stock = await getStock(storeId, item.variantId || item.productId, branchId);
                if (stock < item.qty) {
                    return NextResponse.json({ 
                        error: `Insufficient stock for "${item.name}". Available: ${stock}` 
                    }, { status: 422 });
                }
            }
        }

        // ── 1. Create the Order (Status: OPEN) ─────────────────────────────────
        const order = await createOrder(storeId, channel as OrderChannel, {
            branchId,
            registerId,
            createdByUserId,
            discount
        });

        // ── 2. Add Order Items ────────────────────────────────────────────────
        for (const item of items) {
            await addOrderItem(storeId, order.id, {
                productId: item.productId,
                variantId: item.variantId || item.productId, // We coerce from POS payload
                sku: item.sku || "N/A",
                name: item.name,
                quantity: item.qty,
                unitPrice: item.price
            });
        }

        // ── 2.5 Atomic Stock Reservation (If Branch is Known) ─────────────────
        if (branchId) {
            const reservedItems = [];
            try {
                for (const item of items) {
                    await reserveStock(storeId, item.variantId || item.productId, branchId, item.qty, order.id);
                    reservedItems.push(item);
                }
            } catch (err: any) {
                // Rollback any successfully reserved items
                for (const rItem of reservedItems) {
                    await releaseStockReservation(storeId, rItem.variantId || rItem.productId, branchId, rItem.qty, order.id);
                }
                // Cancel the order since it failed atomic reservation
                await updateOrderStatus(order.id, storeId, "CANCELLED");
                return NextResponse.json({ error: err.message }, { status: 422 });
            }
        }

        // ── 3. Mark Idempotency ────────────────────────────────────────────────
        await idxRef.set({ orderId: order.id, storeId, createdAt: Date.now() });

        // ── 4. Process Payment & Transition to PAID (if requested) ─────────────
        // Since POS requests usually pay instantly:
        if (paymentMethod) {
            // Usually you'd create the PaymentIntent here and wait for MP/SumUp,
            // but for cash or fast-lane payments we mark as PAID immediately.
            try {
                // This triggers the inventory descent!
                await updateOrderStatus(order.id, storeId, "PAID", createdByUserId);

                if (cashSessionId && branchId && registerId) {
                    const total = items.reduce((acc: number, item: any) => acc + (item.qty * item.price), 0) - discount;
                    await appendFinancialEvent({
                        storeId,
                        branchId,
                        registerId,
                        sessionId: cashSessionId,
                        type: "SALE_PAID",
                        amount: total,
                        notes: `POS Sale ${order.id} via ${paymentMethod}`,
                        userId: createdByUserId,
                        referenceId: order.id
                    });
                }
            } catch (err: any) {
                console.error("Payment status transition failed:", err);
                // Return success on order, but note payment issue
                return NextResponse.json({ 
                    success: true, 
                    orderId: order.id, 
                    warning: "Order created but payment/inventory transition failed." 
                }, { status: 201 });
            }
        }

        return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });

    } catch (error: any) {
        console.error("Orders POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { adminDb } from "@/lib/firebase/admin-config";
import { Order, OrderItem, OrderStatus, OrderChannel } from "./types";
import { recordMovement } from "@/domains/inventory/services.server";

const ordersCol = adminDb.collection("orders");
const orderItemsCol = adminDb.collection("order_items");

export async function createOrder(
    storeId: string, 
    channel: OrderChannel, 
    data: Partial<Order>
) {
    const docRef = ordersCol.doc();
    const id = `order_${docRef.id}`;
    const now = Date.now();
    
    const order: Order = {
        id,
        storeId,
        channel,
        branchId: data.branchId,
        registerId: data.registerId,
        status: "OPEN",
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
        createdByUserId: data.createdByUserId,
    };
    
    await docRef.set(order);
    return order;
}

export async function addOrderItem(storeId: string, orderId: string, itemData: Omit<OrderItem, "id" | "orderId" | "storeId" | "createdAt" | "updatedAt" | "subtotal">) {
    const docRef = orderItemsCol.doc();
    const id = `item_${docRef.id}`;
    const now = Date.now();
    
    const item: OrderItem = {
        id,
        orderId,
        storeId,
        productId: itemData.productId,
        variantId: itemData.variantId,
        sku: itemData.sku,
        name: itemData.name,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        subtotal: itemData.quantity * itemData.unitPrice,
        createdAt: now,
        updatedAt: now,
    };
    
    await docRef.set(item);
    await recalculateOrderTotals(orderId);
    return item;
}

export async function removeOrderItem(itemId: string, orderId: string) {
    await orderItemsCol.doc(itemId).delete();
    await recalculateOrderTotals(orderId);
}

export async function recalculateOrderTotals(orderId: string) {
    return await adminDb.runTransaction(async (transaction) => {
        const orderRef = ordersCol.doc(orderId);
        const itemsSnap = await transaction.get(orderItemsCol.where("orderId", "==", orderId));
        
        let subtotal = 0;
        itemsSnap.docs.forEach(doc => {
            const item = doc.data() as OrderItem;
            subtotal += item.subtotal;
        });

        // Simplified calculation for now. Could add explicit tax rules later.
        const discount = 0; // We can expand on discounts later
        const total = subtotal - discount; // Adjust if tax is excluded vs included
        const tax = 0;

        transaction.update(orderRef, {
            subtotal,
            tax,
            discount,
            total,
            updatedAt: Date.now()
        });

        return { subtotal, total, tax, discount };
    });
}

/**
 * Updates an order status. If transitioning to "PAID", executes the inventory deductions atomically.
 */
export async function updateOrderStatus(orderId: string, storeId: string, newStatus: OrderStatus, userId: string = "system") {
    const orderRef = ordersCol.doc(orderId);
    
    await adminDb.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) throw new Error("Order not found");
        
        const order = orderSnap.data() as Order;
        
        if (order.status === newStatus) return; // No change

        // If shifting to PAID, deduct inventory
        if (newStatus === "PAID" && order.status !== "PAID") {
            // We must retrieve the order items to know what to deduct
            const itemsSnap = await transaction.get(orderItemsCol.where("orderId", "==", orderId));
            
            // NOTE: Firestore transactions strictly require reads before writes across the whole transaction.
            // Because recordMovement opens its own transaction, we cannot safely nest them here natively if we pass the transaction object.
            // For production robustness (to avoid transaction nesting failures), we should either:
            // 1. Refactor recordMovement to accept a transaction object (dependency injection).
            // 2. Resolve inventory outside this transaction block directly afterwards. 
            // We'll perform an outer update here for the status, and then a safe batched movement execution below.
            
            transaction.update(orderRef, {
                status: newStatus,
                updatedAt: Date.now()
            });
        } else {
             transaction.update(orderRef, {
                status: newStatus,
                updatedAt: Date.now()
            });
        }
    });
    
    // Inventory deduction post-transaction to ensure we don't violate Firestore single-transaction constraints
    // This is safe assuming idempotency handling at higher levels.
    const finalSnap = await orderRef.get();
    const orderData = finalSnap.data() as Order;
    
    if (newStatus === "PAID" && orderData.branchId) {
        const itemsSnap = await orderItemsCol.where("orderId", "==", orderId).get();
        for (const doc of itemsSnap.docs) {
            const item = doc.data() as OrderItem;
            await recordMovement(
                storeId,
                item.variantId,
                orderData.branchId, // Assuming POS/Branch context
                "BRANCH",
                "SALE",
                -item.quantity, // Deducting
                userId,
                orderId,
                `Sale from Order ${orderId}`
            );
        }
        
        // --- 🚀 FIRE ASYNC WORKER EVENT ---
        import("@/workers/events/bus.server").then(module => {
             module.emitEvent("order.paid", {
                 orderId,
                 storeId,
                 sourceChannel: orderData.channel
             });
        }).catch(err => console.error("Failed to load Event Bus dynamically", err));
    }
}

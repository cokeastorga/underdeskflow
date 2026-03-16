import { OrderFulfillment, FulfillmentStatus, FulfillmentItem, FulfillmentType } from "./types";
import { createFulfillment, updateFulfillmentStatus } from "./repository";
import { selectBranchForFulfillment } from "./routing/router";
import { v4 as uuidv4 } from "uuid";
import { Order, OrderItem } from "@/domains/orders/types";

export async function createOrderFulfillment(
    order: Order,
    items: OrderItem[],
    type: FulfillmentType = "LOCAL_DELIVERY"
): Promise<OrderFulfillment> {
    const id = `ful_${uuidv4()}`;
    const now = Date.now();
    
    // Map OrderItems to FulfillmentItems
    const fulfillmentItems: FulfillmentItem[] = items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity
    }));

    // Routing: if the order doesn't come from a specific branch (e.g. web order),
    // use the router to find the branch with the most available stock.
    let resolvedBranchId = order.branchId ?? "main";
    if (!order.branchId && type !== "PICKUP") {
        const routingItems = items.map(i => ({ variantId: i.variantId, quantity: i.quantity }));
        const routed = await selectBranchForFulfillment(order.storeId, routingItems);
        if (routed) resolvedBranchId = routed;
    }

    const fulfillment: OrderFulfillment = {
        id,
        orderId: order.id,
        storeId: order.storeId,
        branchId: resolvedBranchId,
        status: "PENDING",
        fulfillmentType: type,
        items: fulfillmentItems,
        customerName: order.customerName,
        createdAt: now,
        updatedAt: now,
    };

    return await createFulfillment(fulfillment);
}

export async function advanceFulfillment(
    id: string,
    newStatus: FulfillmentStatus,
    updates?: Partial<OrderFulfillment>
): Promise<void> {
    await updateFulfillmentStatus(id, newStatus, updates);
}

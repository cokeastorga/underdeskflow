import { adminDb } from "@/lib/firebase/admin-config";
import { logger } from "@/lib/logger";

export interface OrderPaidPayload {
    orderId: string;
    storeId: string;
    sourceChannel?: string;
}

export async function handleOrderPaid(payload: OrderPaidPayload, requestId?: string) {
    const { orderId, storeId } = payload;
    
    try {
        logger.info("Worker order.paid start", {
            requestId,
            orderId,
            storeId,
            worker: "order-paid"
        });
        
        // 1. Fetch full order safely
        const orderSnap = await adminDb.collection("orders").doc(orderId).get();
        if (!orderSnap.exists) {
            logger.error(`Order ${orderId} not found in order-paid worker`, { requestId, orderId });
            return;
        }
        
        const order = orderSnap.data()!;
        
        // 2. Perform async long-running tasks
        // await updateSalesAnalytics(storeId, order);
        // await syncOrderToChannels(storeId, order);
        
        logger.info("Worker order.paid completed", {
            requestId,
            orderId,
            storeId
        });

    } catch (err) {
        logger.error("Worker order.paid failed", {
            requestId,
            orderId,
            storeId,
            worker: "order-paid",
            error: err
        });
    }
}

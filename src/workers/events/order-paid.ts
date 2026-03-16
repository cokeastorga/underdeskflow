import { adminDb } from "@/lib/firebase/admin-config";
import { logger } from "@/lib/logger";
import { sendCustomerReceipt, sendTenantNewSaleAlert } from "@/lib/notifications/email";

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

        // 2. Fetch Store Details for the Receipts
        const storeSnap = await adminDb.collection("stores").doc(storeId).get();
        const storeData = storeSnap.data() || { name: "Tienda", email: "contacto@udf.cl" };
        
        // 3. Dispatch Async Emails (Non-blocking)
        Promise.all([
            sendCustomerReceipt(order, storeData.name, requestId),
            sendTenantNewSaleAlert(order, storeData.email, requestId)
        ]).catch((e) => logger.error("Non-fatal email dispatch failure", { requestId, error: e }));

        // 4. Perform further async long-running tasks
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

import { adminDb } from "@/lib/firebase/admin-config";
import { OrderFulfillment, FulfillmentStatus } from "./types";
import { FulfillmentFSM } from "./fsm";
import { FieldValue } from "firebase-admin/firestore";

const FULFILLMENTS_COL = "order_fulfillments";

export async function createFulfillment(fulfillment: OrderFulfillment): Promise<OrderFulfillment> {
    await adminDb.collection(FULFILLMENTS_COL).doc(fulfillment.id).set(fulfillment);
    return fulfillment;
}

export async function getFulfillmentById(id: string): Promise<OrderFulfillment | null> {
    const snap = await adminDb.collection(FULFILLMENTS_COL).doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as OrderFulfillment;
}

export async function getFulfillmentsByOrderId(orderId: string): Promise<OrderFulfillment[]> {
    const snap = await adminDb.collection(FULFILLMENTS_COL).where("orderId", "==", orderId).get();
    return snap.docs.map(doc => doc.data() as OrderFulfillment);
}

export async function updateFulfillmentStatus(
    id: string, 
    newStatus: FulfillmentStatus, 
    updates: Partial<OrderFulfillment> = {}
): Promise<void> {
    const ref = adminDb.collection(FULFILLMENTS_COL).doc(id);
    
    await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error(`Fulfillment ${id} not found`);
        
        const current = snap.data() as OrderFulfillment;
        
        // FSM Guard
        FulfillmentFSM.transition(current.status, newStatus);
        
        const now = Date.now();
        const payload: any = {
            ...updates,
            status: newStatus,
            updatedAt: now
        };
        
        // Audit timestamps based on state
        if (newStatus === "PREPARING" && !current.preparedAt) payload.preparedAt = now;
        if (newStatus === "READY" && !current.readyAt) payload.readyAt = now;
        if (newStatus === "SHIPPED" && !current.shippedAt) payload.shippedAt = now;
        if (newStatus === "DELIVERED" && !current.deliveredAt) payload.deliveredAt = now;

        tx.update(ref, payload);
    });
}

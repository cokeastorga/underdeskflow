import { adminDb } from "@/lib/firebase/admin-config";

export type EventTopic = 
    | "order.created"
    | "payment.failed"
    | "payment.succeeded"
    | "inventory.stock_low"
    | "pos.session_closed";

export interface SystemEvent {
    id: string;
    storeId: string;
    topic: EventTopic;
    payload: Record<string, any>;
    status: "pending" | "processing" | "completed" | "failed";
    retries: number;
    createdAt: number;
    processedAt?: number;
    error?: string;
}

const EVENT_BUS_COLLECTION = "event_bus";

/**
 * Publishes an event to the global Event Bus (stores/{storeId}/event_bus).
 * This queues the event for asynchronous processing by Cloud Tasks / Workers.
 */
export async function pushEvent(
    storeId: string, 
    topic: EventTopic, 
    payload: Record<string, any>,
    transaction?: FirebaseFirestore.Transaction
) {
    const eventRef = adminDb
        .collection("stores")
        .doc(storeId)
        .collection(EVENT_BUS_COLLECTION)
        .doc();

    const eventData: SystemEvent = {
        id: eventRef.id,
        storeId,
        topic,
        payload,
        status: "pending",
        retries: 0,
        createdAt: Date.now()
    };

    if (transaction) {
        transaction.set(eventRef, eventData);
    } else {
        await eventRef.set(eventData);
    }

    // In a real Google Cloud environment, we would enqueue a Cloud Task here
    // pointing to POST /api/internal/workers/event-bus with the eventRef.id
    
    return eventData.id;
}

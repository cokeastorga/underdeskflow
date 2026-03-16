import { adminDb } from "@/lib/firebase/admin-config";
import { v4 as uuidv4 } from "uuid";

export type FinancialEventType = 
    | "SESSION_OPENED" 
    | "SESSION_CLOSED" 
    | "WITHDRAWAL" 
    | "DEPOSIT"
    | "SALE_PAID" 
    | "REFUND_PAID";

export interface FinancialEvent {
    id: string;
    storeId: string;
    branchId: string;
    registerId: string;
    sessionId: string;
    type: FinancialEventType;
    amount: number;
    currency: string;
    notes: string;
    userId: string;
    referenceId?: string; // e.g. orderId, refundId
    createdAt: number;
}

/**
 * Appends an immutable financial event to the `financial_events` collection.
 * This ensures total traceability of physical cash movements (Event Sourcing).
 */
export async function appendFinancialEvent(
    event: Omit<FinancialEvent, "id" | "createdAt" | "currency"> & { currency?: string }
): Promise<FinancialEvent> {
    const id = uuidv4();
    const fullEvent: FinancialEvent = {
        ...event,
        id,
        currency: event.currency || "CLP",
        createdAt: Date.now(),
    };

    await adminDb.collection("financial_events").doc(id).set(fullEvent);
    return fullEvent;
}

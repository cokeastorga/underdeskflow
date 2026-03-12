import { adminDb } from "@/lib/firebase/admin-config";
import { PaymentIntent, PaymentProvider, PaymentIntentStatus } from "./types";
import { updateOrderStatus } from "@/domains/orders/services.server";

const paymentIntentsCol = adminDb.collection("payment_intents");

/**
 * Creates (or retrieves) an idempotent payment intent.
 * CRUCIAL for POS systems where physical button mashes or network drops cause retries.
 */
export async function createPaymentIntent(
    storeId: string,
    orderId: string,
    amount: number,
    provider: PaymentProvider,
    idempotencyKey: string,
    deviceId?: string
) {
    return await adminDb.runTransaction(async (transaction) => {
        // 1. Idempotency Check
        const existingSnap = await transaction.get(
            paymentIntentsCol.where("idempotencyKey", "==", idempotencyKey).limit(1)
        );
        
        if (!existingSnap.empty) {
            // Already initialized. Return existing intent to the client.
            return existingSnap.docs[0].data() as PaymentIntent;
        }
        
        // 2. Create the intent
        const docRef = paymentIntentsCol.doc();
        const id = `pi_${docRef.id}`;
        const now = Date.now();
        
        const intent: PaymentIntent = {
            id,
            orderId,
            storeId,
            amount,
            provider,
            deviceId,
            status: "PENDING",
            idempotencyKey,
            createdAt: now,
            updatedAt: now
        };
        
        transaction.set(docRef, intent);
        return intent;
    });
}

/**
 * Triggered asynchronously by Webhooks (MP, SumUp). 
 * This finalizes the Payment, and cascades the Success chain to Orders & Inventory.
 */
export async function handlePaymentIntentWebhookUpdate(
    intentId: string, 
    newStatus: PaymentIntentStatus, 
    providerTransactionId?: string
) {
    const docRef = paymentIntentsCol.doc(intentId);
    
    const intentSnap = await docRef.get();
    if (!intentSnap.exists) throw new Error("Payment intent not found");
    
    const intent = intentSnap.data() as PaymentIntent;
    
    // Prevent double-success or backwards state changes
    if (intent.status === "SUCCEEDED" && newStatus !== "SUCCEEDED") {
        throw new Error("Cannot modify a succeeded payment intent");
    }
    
    const updates: Partial<PaymentIntent> = {
        status: newStatus,
        updatedAt: Date.now()
    };
    if (providerTransactionId) {
        updates.providerTransactionId = providerTransactionId;
    }
    
    await docRef.update(updates);
    
    // EVENT TRIGGER: Cascade Success
    if (newStatus === "SUCCEEDED" && intent.status !== "SUCCEEDED") {
        // Here we trigger the event/business logic transition:
        // Update Order to PAID (which inside internally updates inventory).
        // Since this runs asynchronously from Webhooks, the user won't be blocked.
        console.log(`Payment [${intentId}] SUCCEEDED. Triggering Order [${intent.orderId}] closure.`);
        
        // Ensure you pass `storeId` down. 
        await updateOrderStatus(intent.orderId, intent.storeId, "PAID", "webhook_system");
        
        // 🚀 Asynchronous workers could listen to this to emit Invoices (SII in Chile).
    }
}

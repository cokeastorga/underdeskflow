import { adminDb } from "@/lib/firebase/admin-config";
import { PaymentIntent, PaymentProvider, PaymentIntentStatus } from "./types";
import { updateOrderStatus } from "@/domains/orders/services.server";
import { reserveStock, releaseStock } from "@/domains/catalog/services.server";

const paymentIntentsCol = adminDb.collection("payment_intents");
const orderItemsCol = adminDb.collection("order_items");
const stockReservationsCol = adminDb.collection("stock_reservations");

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

        // 2. ATOMIC STOCK LOCK (Operación & Monetización)
        // Before creating intent, we must ensure stock is reserved.
        const itemsSnap = await transaction.get(orderItemsCol.where("orderId", "==", orderId));
        
        for (const itemDoc of itemsSnap.docs) {
            const item = itemDoc.data();
            // reserveStock handles its own transaction but we are INSIDE a transaction.
            // In Firestore, we cannot nest transactions that perform writes.
            // HOWEVER, we can perform the stock logic logic directly within THIS transaction.
            // Let's refactor to use the logic here or pass the transaction to reserveStock (refactored).
            // For now, I'll implement a helper that takes a transaction or just do it here.
            
            const variantRef = adminDb.collection("variants").doc(item.variantId);
            const vDoc = await transaction.get(variantRef);
            if (!vDoc.exists) throw new Error(`Variant ${item.variantId} not found`);
            
            const vData = vDoc.data()!;
            const currentStock = vData.stock || 0;
            if (currentStock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}`);
            }
            
            // Deduct
            transaction.update(variantRef, {
                stock: currentStock - item.quantity,
                updatedAt: Date.now()
            });
            
            // Create reservation record
            const resRef = adminDb.collection("stock_reservations").doc();
            transaction.set(resRef, {
                id: resRef.id,
                variantId: item.variantId,
                orderId,
                quantity: item.quantity,
                storeId,
                expiresAt: Date.now() + 15 * 60 * 1000,
                status: "PENDING",
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }
        
        // 3. Create the intent
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
        console.log(`Payment [${intentId}] SUCCEEDED. Triggering Order [${intent.orderId}] closure.`);
        
        await updateOrderStatus(intent.orderId, intent.storeId, "PAID", "webhook_system");

        // Mark reservations as COMPLETED so they are not released by cleanup logic
        try {
            const resSnap = await stockReservationsCol.where("orderId", "==", intent.orderId).where("status", "==", "PENDING").get();
            if (!resSnap.empty) {
                const batch = adminDb.batch();
                resSnap.docs.forEach(doc => {
                    batch.update(doc.ref, { status: "COMPLETED", updatedAt: Date.now() });
                });
                await batch.commit();
            }
        } catch (err) {
            console.error("Failed to mark reservations as completed", err);
        }
    }

    // ROLLBACK: Release stock on failure or expiration
    if ((newStatus === "FAILED" || newStatus === "EXPIRED") && intent.status === "PENDING") {
        console.log(`Payment [${intentId}] ${newStatus}. Releasing stock for Order [${intent.orderId}].`);
        try {
            const resSnap = await stockReservationsCol.where("orderId", "==", intent.orderId).where("status", "==", "PENDING").get();
            for (const doc of resSnap.docs) {
                await releaseStock(doc.id);
            }
        } catch (err) {
            console.error("Failed to release stock reservations on failure", err);
        }
    }
}

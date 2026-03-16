import { adminDb } from "@/lib/firebase/admin-config";
import { InventoryMovement, InventoryBalance, InventoryLocationType, InventoryMovementType } from "./types";
import { FieldValue } from "firebase-admin/firestore";

const balancesCol = adminDb.collection("inventory_balances");
const movementsCol = adminDb.collection("inventory_movements");

// Atomically record a movement and update the balance
export async function recordMovement(
    storeId: string,
    variantId: string,
    locationId: string,
    locationType: InventoryLocationType,
    type: InventoryMovementType,
    quantity: number,
    createdByUserId: string,
    referenceId?: string,
    note?: string
) {
    const balanceId = `${variantId}_${locationId}`;
    const balanceRef = balancesCol.doc(balanceId);
    const movementRef = movementsCol.doc();

    return await adminDb.runTransaction(async (transaction) => {
        const balanceDoc = await transaction.get(balanceRef);
        let currentStock = 0;

        if (balanceDoc.exists) {
            currentStock = (balanceDoc.data() as InventoryBalance).stock;
        } else {
            // Initialize balance
            transaction.set(balanceRef, {
                id: balanceId,
                storeId,
                variantId,
                locationId,
                locationType,
                stock: 0,
                updatedAt: Date.now()
            });
        }

        const balanceAfter = currentStock + quantity;

        const movement: InventoryMovement = {
            id: `inv_mov_${movementRef.id}`,
            storeId,
            variantId,
            locationId,
            locationType,
            type,
            quantity,
            balanceAfter,
            referenceId,
            note,
            createdAt: Date.now(),
            createdByUserId
        };

        // Update balance
        transaction.update(balanceRef, {
            stock: balanceAfter,
            updatedAt: Date.now()
        });

        // Record immutable ledger entry
        transaction.set(movementRef, movement);

        return movement;
    });
}

// Helper to query current stock
export async function getStock(storeId: string, variantId: string, locationId: string) {
    const balanceId = `${variantId}_${locationId}`;
    const snap = await balancesCol.doc(balanceId).get();
    if (!snap.exists) return 0;
    return (snap.data() as InventoryBalance).stock;
}

/**
 * Atomically reserves stock.
 * Reduces the available physical stock immediately to prevent parallel overselling.
 * @throws Error if insufficient stock is available.
 */
export async function reserveStock(
    storeId: string,
    variantId: string,
    locationId: string,
    quantity: number,
    referenceId: string // e.g. orderId or paymentIntentId
) {
    const balanceId = `${variantId}_${locationId}`;
    const balanceRef = balancesCol.doc(balanceId);
    const movementRef = movementsCol.doc();

    return await adminDb.runTransaction(async (transaction) => {
        const balanceDoc = await transaction.get(balanceRef);
        let currentStock = 0;

        if (balanceDoc.exists) {
            currentStock = (balanceDoc.data() as InventoryBalance).stock;
        }

        if (currentStock < quantity) {
            throw new Error(`Insufficient stock for variant ${variantId} at location ${locationId}`);
        }

        const balanceAfter = currentStock - quantity;

        const movement: InventoryMovement = {
            id: `inv_mov_${movementRef.id}`,
            storeId,
            variantId,
            locationId,
            locationType: "BRANCH", // Default assumption for checkout
            type: "RESERVED",
            quantity: -quantity,
            balanceAfter,
            referenceId,
            note: "Atomic Checkout Reservation",
            createdAt: Date.now(),
            createdByUserId: "SYSTEM"
        };

        transaction.update(balanceRef, {
            stock: balanceAfter,
            updatedAt: Date.now()
        });

        transaction.set(movementRef, movement);

        return movement;
    });
}

/**
 * Releases an atomic reservation, restoring the stock back to the physical pool.
 */
export async function releaseStockReservation(
    storeId: string,
    variantId: string,
    locationId: string,
    quantity: number,
    referenceId: string
) {
    const balanceId = `${variantId}_${locationId}`;
    const balanceRef = balancesCol.doc(balanceId);
    const movementRef = movementsCol.doc();

    return await adminDb.runTransaction(async (transaction) => {
        const balanceDoc = await transaction.get(balanceRef);
        let currentStock = 0;

        if (balanceDoc.exists) {
            currentStock = (balanceDoc.data() as InventoryBalance).stock;
        }

        const balanceAfter = currentStock + quantity;

        const movement: InventoryMovement = {
            id: `inv_mov_${movementRef.id}`,
            storeId,
            variantId,
            locationId,
            locationType: "BRANCH",
            type: "RESERVATION_RELEASED",
            quantity: quantity,
            balanceAfter,
            referenceId,
            note: "Reservation expired or cancelled",
            createdAt: Date.now(),
            createdByUserId: "SYSTEM"
        };

        if (balanceDoc.exists) {
            transaction.update(balanceRef, {
                stock: balanceAfter,
                updatedAt: Date.now()
            });
        } else {
            transaction.set(balanceRef, {
                id: balanceId,
                storeId,
                variantId,
                locationId,
                locationType: "BRANCH",
                stock: balanceAfter,
                updatedAt: Date.now()
            });
        }

        transaction.set(movementRef, movement);

        return movement;
    });
}
/**
 * Confirms an atomic reservation, registering a formal SALE in the ledger 
 * without double-deducting the physical stock balance.
 */
export async function confirmStockReservation(
    storeId: string,
    variantId: string,
    locationId: string,
    quantity: number,
    referenceId: string
) {
    const balanceId = `${variantId}_${locationId}`;
    const balanceRef = balancesCol.doc(balanceId);
    const movementRef = movementsCol.doc();

    return await adminDb.runTransaction(async (transaction) => {
        const balanceDoc = await transaction.get(balanceRef);
        let currentStock = 0;

        if (balanceDoc.exists) {
            currentStock = (balanceDoc.data() as InventoryBalance).stock;
        }

        // We DO NOT deduct the stock again, because `RESERVED` already did.
        const balanceAfter = currentStock;

        const movement: InventoryMovement = {
            id: `inv_mov_${movementRef.id}`,
            storeId,
            variantId,
            locationId,
            locationType: "BRANCH",
            type: "SALE",
            quantity: -quantity, // Represents the true outbound flow for reporting
            balanceAfter,
            referenceId,
            note: "Reservation confirmed as Sale",
            createdAt: Date.now(),
            createdByUserId: "SYSTEM"
        };

        transaction.set(movementRef, movement);

        return movement;
    });
}
/**
 * Transfers stock from one location (origin) to another (destination) atomically.
 * This records a TRANSFER_OUT at the source and a TRANSFER_IN at the destination
 * in a single Firestore batch — so both succeed or both fail together.
 */
export async function transferStock(
    storeId: string,
    variantId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
    createdByUserId: string,
    transferReferenceId?: string
): Promise<{ out: InventoryMovement; into: InventoryMovement }> {
    const fromBalanceId = `${variantId}_${fromLocationId}`;
    const toBalanceId = `${variantId}_${toLocationId}`;

    const fromBalanceRef = balancesCol.doc(fromBalanceId);
    const toBalanceRef = balancesCol.doc(toBalanceId);
    const outMovRef = movementsCol.doc();
    const inMovRef = movementsCol.doc();
    const now = Date.now();
    const refId = transferReferenceId ?? `transfer_${outMovRef.id}`;

    return await adminDb.runTransaction(async (tx) => {
        const [fromSnap, toSnap] = await Promise.all([
            tx.get(fromBalanceRef),
            tx.get(toBalanceRef),
        ]);

        const fromStock = fromSnap.exists ? (fromSnap.data() as InventoryBalance).stock : 0;
        if (fromStock < quantity) {
            throw new Error(`Insufficient stock at ${fromLocationId}: available ${fromStock}, requested ${quantity}`);
        }
        const toStock = toSnap.exists ? (toSnap.data() as InventoryBalance).stock : 0;

        const fromAfter = fromStock - quantity;
        const toAfter = toStock + quantity;

        // TRANSFER_OUT from source
        const outMovement: InventoryMovement = {
            id: `inv_mov_${outMovRef.id}`,
            storeId, variantId,
            locationId: fromLocationId,
            locationType: "BRANCH",
            type: "TRANSFER_OUT",
            quantity: -quantity,
            balanceAfter: fromAfter,
            referenceId: refId,
            note: `Transfer to ${toLocationId}`,
            createdAt: now,
            createdByUserId,
        };

        // TRANSFER_IN to destination
        const inMovement: InventoryMovement = {
            id: `inv_mov_${inMovRef.id}`,
            storeId, variantId,
            locationId: toLocationId,
            locationType: "BRANCH",
            type: "TRANSFER_IN",
            quantity,
            balanceAfter: toAfter,
            referenceId: refId,
            note: `Transfer from ${fromLocationId}`,
            createdAt: now,
            createdByUserId,
        };

        tx.update(fromBalanceRef, { stock: fromAfter, updatedAt: now });
        if (toSnap.exists) {
            tx.update(toBalanceRef, { stock: toAfter, updatedAt: now });
        } else {
            tx.set(toBalanceRef, {
                id: toBalanceId, storeId, variantId,
                locationId: toLocationId, locationType: "BRANCH",
                stock: toAfter, updatedAt: now,
            });
        }
        tx.set(outMovRef, outMovement);
        tx.set(inMovRef, inMovement);

        return { out: outMovement, into: inMovement };
    });
}

/**
 * Returns all balance records for a given variant across every location for a store.
 * Useful for the multi-branch fulfillment routing decision.
 */
export async function getStockByStore(
    storeId: string,
    variantId: string
): Promise<InventoryBalance[]> {
    const snap = await balancesCol
        .where("storeId", "==", storeId)
        .where("variantId", "==", variantId)
        .get();
    return snap.docs.map(d => d.data() as InventoryBalance);
}

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

export type InventoryLocationType = "FACTORY" | "BRANCH";
export type InventoryMovementType = "SALE" | "TRANSFER_IN" | "TRANSFER_OUT" | "RETURN" | "ADJUSTMENT" | "PRODUCTION" | "RESERVED" | "RESERVATION_RELEASED";

export interface InventoryMovement {
    id: string; // e.g., inv_mov_123
    storeId: string;
    variantId: string; // SKU or Var ID
    locationId: string; // Links to branchId or factoryId
    locationType: InventoryLocationType;
    type: InventoryMovementType;
    quantity: number; // Can be negative for OUT/SALE, positive for IN/PRODUCTION
    balanceAfter: number; // Immutable snapshot
    referenceId?: string; // e.g. An Order ID or Transfer ID
    note?: string;
    createdAt: number;
    createdByUserId: string;
}

export interface InventoryBalance {
    id: string; // Combines variantId_locationId
    storeId: string;
    variantId: string;
    locationId: string;
    locationType: InventoryLocationType;
    stock: number;
    updatedAt: number;
}

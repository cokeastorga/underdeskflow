import { describe, it, expect } from "vitest";

// Pure function extracted for ledger math
export function calculateNewInventoryBalance(currentStock: number, movementDelta: number): number {
    return Math.max(0, currentStock + movementDelta);
}

describe("Inventory Ledger Core Math", () => {
    
    it("reduces stock correctly when a sale occurs", () => {
        const currentStock = 10;
        const movementDelta = -3; // Sale of 3 items
        
        const result = calculateNewInventoryBalance(currentStock, movementDelta);
        expect(result).toBe(7);
    });

    it("increases stock correctly when a production movement occurs", () => {
        const currentStock = 5;
        const movementDelta = 20; // Baked 20 more empanadas
        
        const result = calculateNewInventoryBalance(currentStock, movementDelta);
        expect(result).toBe(25);
    });

    it("prevents ghost negative stock", () => {
        const currentStock = 2;
        const movementDelta = -5; // System mismatch or concurrency issue tries to sell 5
        
        // At the math level, it shouldn't allow negative records
        const result = calculateNewInventoryBalance(currentStock, movementDelta);
        expect(result).toBe(0);
    });
});

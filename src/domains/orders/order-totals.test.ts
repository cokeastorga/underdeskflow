import { describe, it, expect } from "vitest";
import { calculateOrderTotals } from "./utils";

describe("Order Totals Calculator (UDF SaaS)", () => {
    
    it("calculates subtotal correctly without discounts or fees (e.g. physical POS cash sale)", () => {
        const items = [
            { price: 1000, quantity: 2 },
            { price: 500, quantity: 1 }
        ];
        
        const totals = calculateOrderTotals(items);
        
        expect(totals.subtotal).toBe(2500);
        expect(totals.total).toBe(2500);
        expect(totals.discountAmount).toBe(0);
        expect(totals.platformFee).toBe(0);
    });

    it("applies fixed discount properly", () => {
        const items = [
            { price: 1500, quantity: 2 } // Subtotal: 3000
        ];
        
        const totals = calculateOrderTotals(items, 500);
        
        expect(totals.subtotal).toBe(3000);
        expect(totals.total).toBe(2500);
        expect(totals.discountAmount).toBe(500);
        expect(totals.platformFee).toBe(0);
    });

    it("calculates the 8% UnderDeskFlow platform fee for online channels", () => {
        const items = [
            { price: 10000, quantity: 1 } // Subtotal: 10000
        ];
        
        // 8% fee on a 10000 total should be 800
        const totals = calculateOrderTotals(items, 0, 0.08);
        
        expect(totals.subtotal).toBe(10000);
        expect(totals.total).toBe(10000); // the total amount the customer pays
        expect(totals.platformFee).toBe(800); // the amount UDF retains
    });

    it("prevents negative totals if discount exceeds subtotal", () => {
        const items = [
            { price: 1000, quantity: 1 } // Subtotal: 1000
        ];
        
        const totals = calculateOrderTotals(items, 1500, 0.08);
        
        expect(totals.subtotal).toBe(1000);
        expect(totals.total).toBe(0); // Should never drop below 0
        expect(totals.platformFee).toBe(0); // 8% of 0 is 0
    });
});


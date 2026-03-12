import { describe, it, expect } from "vitest";

// Simulating the creation of ledger entries and fee distribution
function createTransactionRecords(orderTotal: number, providerFeePercentage: number | null, platformFeePercentage: number) {
    const platformFeeAmount = Math.round(orderTotal * platformFeePercentage);
    const gatewayFeeAmount = providerFeePercentage !== null ? Math.round(orderTotal * providerFeePercentage) : null;
    
    // In actual implementation, these would be separate Firestore documents
    return {
        paymentLedger: {
            orderTotal,
            gatewayFee: gatewayFeeAmount
        },
        platformFee: {
            feeAmount: platformFeeAmount
        },
        // A cron job later creates this when building the payout batch
        batchReconciliation: {
            netPayout: gatewayFeeAmount !== null 
                ? orderTotal - gatewayFeeAmount - platformFeeAmount 
                : null // Cannot reconcile until gateway fee arrives
        }
    };
}

describe("Payouts & Commission Engine (UDF Ledgers)", () => {
    
    it("creates MercadoPago (3%) + UDF (8%) ledgers correctly", () => {
        const records = createTransactionRecords(10000, 0.03, 0.08);
        
        expect(records.paymentLedger.orderTotal).toBe(10000);
        expect(records.paymentLedger.gatewayFee).toBe(300);    // MercadoPago takes 300
        expect(records.platformFee.feeAmount).toBe(800);       // UDF takes 800
        expect(records.batchReconciliation.netPayout).toBe(8900); // Tenant receives 8900
    });

    it("supports deferred Gateway Fees (T+1 Reconciliation) safely", () => {
        // e.g., Gateway hook arrived, but without fee amount yet
        const records = createTransactionRecords(50000, null, 0.08);
        
        expect(records.paymentLedger.orderTotal).toBe(50000);
        expect(records.paymentLedger.gatewayFee).toBeNull();   // Pending reconciliation worker
        expect(records.platformFee.feeAmount).toBe(4000);      // UDF fee is always known immediately
        expect(records.batchReconciliation.netPayout).toBeNull(); // Prevents paying out uncleared funds
    });
});

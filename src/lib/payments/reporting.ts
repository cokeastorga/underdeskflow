import { createHash } from "crypto";
import {
    TenantReport,
    ReportingPeriod,
    LedgerTransaction,
} from "@/types/payments";
import {
    sumIntentsByStore,
    sumRefundsByStore,
    queryLedgerTransactions,
} from "./repository";

/**
 * Reporting Logic — Aggregates commercial and financial data.
 *
 * Princitples:
 * 1. Ledger-first for money movements.
 * 2. Intent-based for commercial volume (GMV).
 * 3. Immutable aggregation (pure functions).
 */

export async function generateTenantRevenueReport(
    storeId: string,
    period: ReportingPeriod,
    currency: string = "CLP"
): Promise<TenantReport> {
    const { start, end } = period;

    // 1. Fetch data in parallel for efficiency
    const [commercialData, refundVolume, ledgerTxs] = await Promise.all([
        sumIntentsByStore(storeId, start, end),
        sumRefundsByStore(storeId, start, end),
        queryLedgerTransactions(storeId, start, end),
    ]);

    // 2. Aggregate financial metrics from Ledger
    // Pattern: Total(Account) = Sum of all entries. 
    // Since Credits are stored as negative in our ledger.ts builder, 
    // a positive result means a Net DEBIT (balance decrease/expense), 
    // and a negative result means a Net CREDIT (balance increase/income).
    // We return them as positive absolute values for the report representation.
    let platformFees = 0;
    let netPayoutable = 0;

    ledgerTxs.forEach(tx => {
        tx.entries.forEach(entry => {
            if (entry.account === "platform_commissions") {
                platformFees += entry.amount;
            } else if (entry.account === "payoutable_balance") {
                netPayoutable += entry.amount;
            }
        });
    });

    // 3. Calculate Audit Checksum
    // Concatenate IDs and creation times to detect if data changed or was missed
    const checksumBase = ledgerTxs
        .sort((a, b) => a.created_at - b.created_at)
        .map(tx => `${tx.id}:${tx.created_at}`)
        .join("|");
    const ledgerChecksum = createHash("sha256").update(checksumBase).digest("hex");

    // 4. Assemble technical report
    const gmv = commercialData.gmv;
    const refundRate = gmv > 0 ? refundVolume / gmv : 0;

    return {
        store_id: storeId,
        period,
        currency,
        gmv,
        refund_volume: refundVolume,
        refund_rate: refundRate,

        // Convert ledger balance (credit-heavy) to positive display metrics
        // (Credits are negative in DB, so -fees = positive income)
        platform_fees: Math.abs(platformFees),
        net_payoutable: Math.abs(netPayoutable),

        ledger_checksum: ledgerChecksum,
        generated_at: Date.now(),
    };
}

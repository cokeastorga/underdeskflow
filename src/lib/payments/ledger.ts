import { v4 as uuidv4 } from "uuid";
import {
    PaymentIntent,
    Refund,
    LedgerTransaction,
    LedgerEntry,
    Payout,
    OrderSource,
} from "@/types/payments";
import { calculatePlatformFee } from "./fee.service";

/**
 * Ledger Logic — Generates double-entry accounting entries for financial events.
 *
 * Pattern:
 *   - Assets increase with DEBIT, decrease with CREDIT.
 *   - Liabilities & Income increase with CREDIT, decrease with DEBIT.
 *
 * Total Debits + Total Credits must ALWAYS sum to zero.
 */

/**
 * Generates the ledger transaction for a successful payment (tienda propia).
 *
 * fee_venta = 8% on OWN_STORE sales, 0% on EXTERNAL_CHANNEL sales.
 *
 * Transaction (OWN_STORE example, venta $10.000):
 *   DEBIT  psp_pending            $10.000  (asset increase — full amount held by PSP)
 *   CREDIT payoutable_balance     $9.200   (merchant receives net: gross − 8% fee)
 *   CREDIT platform_commissions   $800     (platform earns 8% fee_venta)
 */
export function buildPaymentPaidTransaction(
    intent: PaymentIntent,
    referenceId: string,            // The attempt_id or provider_event_id
    orderSource: OrderSource = "OWN_STORE"
): LedgerTransaction {
    const amount = intent.amount;
    const fee = calculatePlatformFee(amount, orderSource);
    const net = amount - fee;

    const entries: LedgerEntry[] = [
        {
            id: uuidv4(),
            account: "psp_pending",
            amount: amount,
            type: "DEBIT",
            currency: intent.currency,
        },
        {
            id: uuidv4(),
            account: "payoutable_balance",
            amount: -net,
            type: "CREDIT",
            currency: intent.currency,
        },
        {
            id: uuidv4(),
            account: "platform_commissions",
            amount: -fee,
            type: "CREDIT",
            currency: intent.currency,
        },
    ];

    validateTransaction(entries);

    return {
        id: uuidv4(),
        payment_intent_id: intent.id,
        store_id: intent.store_id,
        reference_id: referenceId,
        order_source: orderSource,
        type: "PAYMENT_PAID",
        description: `Payment success for order ${intent.order_id} [${orderSource}] fee=${fee}`,
        entries,
        created_at: Date.now(),
    };
}

/**
 * Generates the ledger transaction for a successful refund.
 *
 * Transaction:
 *   DEBIT  payoutable_balance    (Net refund — liability decrease to tenant)
 *   DEBIT  platform_commissions  (Fee reversal — income decrease to platform)
 *   CREDIT psp_pending           (Full refund — asset decrease)
 */
export function buildRefundSucceededTransaction(
    intent: PaymentIntent,
    refund: Refund
): LedgerTransaction {
    const amount = refund.amount;
    const feeReversal = refund.refund_fee;
    const netReversal = amount - feeReversal;

    const entries: LedgerEntry[] = [
        {
            id: uuidv4(),
            account: "payoutable_balance",
            amount: netReversal,
            type: "DEBIT",
            currency: refund.currency,
        },
        {
            id: uuidv4(),
            account: "platform_commissions",
            amount: feeReversal,
            type: "DEBIT",
            currency: refund.currency,
        },
        {
            id: uuidv4(),
            account: "psp_pending",
            amount: -amount,
            type: "CREDIT",
            currency: refund.currency,
        },
    ];

    validateTransaction(entries);

    return {
        id: uuidv4(),
        payment_intent_id: intent.id,
        store_id: intent.store_id,
        reference_id: refund.id,
        order_source: "OWN_STORE",  // Refunds always mirror the original sale source
        type: "REFUND_SUCCEEDED",
        description: `Refund for order ${intent.order_id} (${refund.reason})`,
        entries,
        created_at: Date.now(),
    };
}

/**
 * Generates the ledger transaction for a payout request (PENDING).
 * Moves funds from the tenant's balance to the "in-flight" liability account.
 *
 * Transaction:
 *   DEBIT  payoutable_balance    (Liability decrease — funds earmarked)
 *   CREDIT payout_liability      (Liability increase — funds in flight)
 */
export function buildPayoutRequestedTransaction(
    payout: Payout
): LedgerTransaction {
    const entries: LedgerEntry[] = [
        {
            id: uuidv4(),
            account: "payoutable_balance",
            amount: payout.amount,
            type: "DEBIT",
            currency: payout.currency,
        },
        {
            id: uuidv4(),
            account: "payout_liability",
            amount: -payout.amount,
            type: "CREDIT",
            currency: payout.currency,
        },
    ];

    validateTransaction(entries);

    return {
        id: uuidv4(),
        store_id: payout.store_id,
        reference_id: payout.id,
        order_source: "OWN_STORE",
        type: "PAYOUT_REQUESTED",
        description: `Payout requested for store ${payout.store_id}`,
        entries,
        created_at: Date.now(),
    };
}

/**
 * Generates the ledger transaction for a payout entering PROCESSING state.
 * No funds move between accounts, but the transaction record marks the
 * technical state transition in the audit trail.
 */
export function buildPayoutProcessingTransaction(
    payout: Payout
): LedgerTransaction {
    return {
        id: uuidv4(),
        store_id: payout.store_id,
        reference_id: payout.id,
        order_source: "OWN_STORE",
        type: "PAYOUT_PROCESSING",
        description: `Payout sent to bank (processing)`,
        entries: [], // Zero-sum / No movement transaction for state tracking
        created_at: Date.now(),
    };
}

/**
 * Generates the ledger transaction for a successful payout.
 * Clears the "in-flight" liability against the actual PSP pending bucket.
 *
 * Transaction:
 *   DEBIT  payout_liability      (Liability decrease — funds moved)
 *   CREDIT psp_pending           (Asset decrease — PSP paid out)
 */
export function buildPayoutSucceededTransaction(
    payout: Payout
): LedgerTransaction {
    const entries: LedgerEntry[] = [
        {
            id: uuidv4(),
            account: "payout_liability",
            amount: payout.amount,
            type: "DEBIT",
            currency: payout.currency,
        },
        {
            id: uuidv4(),
            account: "psp_pending",
            amount: -payout.amount,
            type: "CREDIT",
            currency: payout.currency,
        },
    ];

    validateTransaction(entries);

    return {
        id: uuidv4(),
        store_id: payout.store_id,
        reference_id: payout.id,
        order_source: "OWN_STORE",
        type: "PAYOUT_SUCCEEDED",
        description: `Payout settled ${payout.id}`,
        entries,
        created_at: Date.now(),
    };
}

/**
 * Generates the ledger transaction for a failed payout (Reversal).
 * Moves funds back to the tenant's balance.
 */
export function buildPayoutFailedTransaction(
    payout: Payout
): LedgerTransaction {
    const entries: LedgerEntry[] = [
        {
            id: uuidv4(),
            account: "payout_liability",
            amount: payout.amount,
            type: "DEBIT",
            currency: payout.currency,
        },
        {
            id: uuidv4(),
            account: "payoutable_balance",
            amount: -payout.amount,
            type: "CREDIT",
            currency: payout.currency,
        },
    ];

    validateTransaction(entries);

    return {
        id: uuidv4(),
        store_id: payout.store_id,
        reference_id: payout.id,
        order_source: "OWN_STORE",
        type: "PAYOUT_FAILED",
        description: `Payout failed reversal ${payout.id}`,
        entries,
        created_at: Date.now(),
    };
}

/** Invariant check: ensure the transaction is balanced (sums to zero). */
function validateTransaction(entries: LedgerEntry[]): void {
    const sum = entries.reduce((acc, e) => acc + e.amount, 0);
    if (Math.abs(sum) > 0.001) {
        throw new Error(`Ledger transaction is unbalanced. Sum: ${sum}`);
    }
}

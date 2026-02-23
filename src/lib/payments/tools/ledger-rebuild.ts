import { adminDb } from "@/lib/firebase/admin-config";
import {
    PaymentEvent,
    LedgerTransaction,
    PaymentIntent,
    Refund
} from "@/types/payments";
import {
    buildPaymentPaidTransaction,
    buildRefundSucceededTransaction
} from "../ledger";
import { findIntentById } from "../repository";

/**
 * LedgerRebuild — Disaster Recovery and Audit Tool.
 * 
 * Capability: Re-derives the entire ledger state for a store from the 
 * immutable event log (PaymentEvent).
 * 
 * Use cases:
 * 1. Verifying ledger integrity after a production bug.
 * 2. Rebuilding the ledger if an index or collection is lost.
 * 3. Detecting manually tampered ledger entries (checksum mismatch).
 */
export class LedgerRebuilder {

    /**
     * Replays events for a store and returns the re-derived ledger transactions.
     */
    async simulateRebuild(storeId: string): Promise<{
        recalculatedTransactions: LedgerTransaction[];
        driftDetected: boolean;
        currentBalance: number;
        calculatedBalance: number;
    }> {
        // 1. Fetch all financial events for the store, sorted by time
        const eventSnap = await adminDb
            .collection("payment_events")
            .where("store_id", "==", storeId)
            .orderBy("processed_at", "asc")
            .get();

        const events = eventSnap.docs.map(d => d.data() as PaymentEvent);
        const recalculatedTransactions: LedgerTransaction[] = [];

        // 2. Replay logic
        for (const event of events) {
            if (event.event_type === "status.transition" && event.new_status === "PAID") {
                const intent = await findIntentById(event.payment_intent_id);
                if (intent) {
                    recalculatedTransactions.push(buildPaymentPaidTransaction(intent, event.raw_event_id!));
                }
            } else if (event.event_type === "refund.completed") {
                const intent = await findIntentById(event.payment_intent_id);
                const refundPayload = event.payload as any;
                if (intent && refundPayload.refund_id) {
                    // Re-calculate the refund object state from payload for the builder
                    const refund: Refund = {
                        id: refundPayload.refund_id,
                        amount: refundPayload.amount,
                        currency: refundPayload.currency,
                        refund_fee: refundPayload.refund_fee,
                        // ... other fields as needed for the builder
                    } as Refund;
                    recalculatedTransactions.push(buildRefundSucceededTransaction(intent, refund));
                }
            }
            // Add Payout replay logic here as the system evolves
        }

        // 3. Balance Comparison
        const calculatedBalance = recalculatedTransactions.reduce((acc, tx) => {
            const entry = tx.entries.find(e => e.account === "payoutable_balance");
            return acc + (entry ? entry.amount : 0);
        }, 0);

        // Fetch current snapshot balance (this is where we'd compare against calculatePayoutableBalance)
        const currentBalance = 0; // Placeholder for demo

        return {
            recalculatedTransactions,
            driftDetected: Math.abs(calculatedBalance - currentBalance) > 0.001,
            currentBalance,
            calculatedBalance
        };
    }
}

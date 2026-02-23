import { adminDb } from "@/lib/firebase/admin-config";
import { OrchestratorError } from "@/types/payments";

/**
 * FinancialGuard — Velocity limits and abuse prevention.
 * 
 * Unlike standard WAF/HTTP rate limiting, this layer understands 
 * the financial impact of operations.
 */
export class FinancialGuard {

    // Daily thresholds (CLP - for Chile-focused MVP)
    private static DAILY_REFUND_LIMIT = 5000000; // $5.0M
    private static DAILY_PAYOUT_LIMIT = 10000000; // $10M

    /**
     * Verifies that the store hasn't exceeded its daily refund velocity.
     * Prevents "refund-bombing" attacks or massive operator mistakes.
     */
    async checkRefundVelocity(storeId: string, requestedAmount: number): Promise<void> {
        const todayStart = new Date().setHours(0, 0, 0, 0);

        const refundsSnap = await adminDb
            .collection("payment_refunds")
            .where("store_id", "==", storeId)
            .where("created_at", ">=", todayStart)
            .get();

        const totalRefundedToday = refundsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);

        if (totalRefundedToday + requestedAmount > FinancialGuard.DAILY_REFUND_LIMIT) {
            throw new OrchestratorError("REFUND_EXCEEDS_DAILY_LIMIT", {
                store_id: storeId,
                daily_limit: FinancialGuard.DAILY_REFUND_LIMIT,
                current: totalRefundedToday,
                requested: requestedAmount
            });
        }
    }

    /**
     * Verifies that the store hasn't exceeded its daily payout velocity.
     */
    async checkPayoutVelocity(storeId: string, requestedAmount: number): Promise<void> {
        const todayStart = new Date().setHours(0, 0, 0, 0);

        const payoutsSnap = await adminDb
            .collection("payment_payouts")
            .where("store_id", "==", storeId)
            .where("created_at", ">=", todayStart)
            .get();

        const totalPaidOutToday = payoutsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);

        if (totalPaidOutToday + requestedAmount > FinancialGuard.DAILY_PAYOUT_LIMIT) {
            throw new OrchestratorError("PAYOUT_EXCEEDS_DAILY_LIMIT", {
                store_id: storeId,
                daily_limit: FinancialGuard.DAILY_PAYOUT_LIMIT,
                current: totalPaidOutToday,
                requested: requestedAmount
            });
        }
    }
}

export const financialGuard = new FinancialGuard();

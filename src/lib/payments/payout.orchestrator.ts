import { v4 as uuidv4 } from "uuid";
import {
    Payout,
    PayoutStatus,
    OrchestratorError,
    LedgerTransaction
} from "@/types/payments";
import { Store } from "@/types/store";
import {
    calculatePayoutableBalance,
    savePayout,
    findPayoutById,
    transitionPayoutStatus,
    findPayoutByIdempotencyKey
} from "./repository";
import {
    buildPayoutRequestedTransaction,
    buildPayoutProcessingTransaction,
    buildPayoutSucceededTransaction,
    buildPayoutFailedTransaction
} from "./ledger";
import { financialGuard } from "./guard";
import { adminDb } from "@/lib/firebase/admin-config";

/**
 * PayoutOrchestrator — The "Last Mile" of the financial engine.
 * Handles moving funds from internal balances to external bank accounts.
 * Implementation follows mandatory Principal Engineer guardrails.
 */
export class PayoutOrchestrator {

    /**
     * Initiates a payout request for a store.
     * Guardrails:
     * 1. Store must be ACTIVE (Compliance check).
     * 2. Store must have verified bank details.
     * 3. Balance must be sufficient (Ledger-based).
     * 4. Atomic Liability move (payoutable_balance -> payout_liability).
     * 5. Immutable bank snapshot.
     */
    async requestPayout(storeId: string, amount: number, idempotencyKey: string): Promise<Payout> {
        // 1. Check for existing Payout (Idempotency)
        const existing = await findPayoutByIdempotencyKey(idempotencyKey);
        if (existing) return existing;

        // 2. Resolve Store & Compliance Status
        const storeSnap = await adminDb.collection("stores").doc(storeId).get();
        if (!storeSnap.exists) throw new OrchestratorError("STORE_NOT_FOUND", { storeId });
        const store = storeSnap.data() as Store;

        if (store.compliance_status === "SUSPENDED") {
            throw new OrchestratorError("STORE_SUSPENDED", { storeId, status: store.compliance_status });
        }

        if (store.is_read_only === true) {
            throw new OrchestratorError("READ_ONLY_MODE_ENABLED", { storeId });
        }

        // ── Financial Safeguards ──────────────────────────────────────────
        await financialGuard.checkPayoutVelocity(storeId, amount);

        if (!store.bank_account || !store.bank_account.verified) {
            throw new OrchestratorError("BANK_ACCOUNT_NOT_VERIFIED", { storeId });
        }

        // 3. Verify Balance (Ultimate Source of Truth: Ledger)
        const availableBalance = await calculatePayoutableBalance(storeId);
        if (availableBalance < amount) {
            throw new OrchestratorError("INSUFFICIENT_BALANCE", { storeId, availableBalance, requested: amount });
        }

        // 4. Prepare Payout & Ledger Transaction
        const payoutId = uuidv4();
        const now = Date.now();
        const payout: Payout = {
            id: payoutId,
            store_id: storeId,
            amount: amount,
            currency: store.currency,
            status: "REQUESTED",
            bank_snapshot: {
                bank_name: store.bank_account.bank_name,
                bank_account_number: store.bank_account.account_number,
                bank_account_type: store.bank_account.account_type,
                bank_entity_id: store.bank_account.entity_id,
            },
            idempotency_key: idempotencyKey,
            processed_at: null,
            created_at: now,
            updated_at: now,
        };

        const ledgerTx = buildPayoutRequestedTransaction(payout);

        // 5. Atomic Persistence
        await savePayout(payout, ledgerTx);

        return payout;
    }

    /**
     * Marks a payout as PROCESSING (sent to bank file / API).
     */
    async markProcessing(payoutId: string): Promise<void> {
        const payout = await findPayoutById(payoutId);
        if (!payout) throw new OrchestratorError("PAYOUT_NOT_FOUND", { payoutId });

        if (payout.status !== "REQUESTED") {
            throw new OrchestratorError("INVALID_PAYOUT_TRANSITION", { payoutId, from: payout.status, to: "PROCESSING" });
        }

        const ledgerTx = buildPayoutProcessingTransaction(payout);
        await transitionPayoutStatus(payoutId, "PROCESSING", ledgerTx);
    }

    /**
     * Finalizes a successful payout.
     * Liability is cleared against PSP pending balance.
     */
    async finalizePayout(payoutId: string): Promise<void> {
        const payout = await findPayoutById(payoutId);
        if (!payout) throw new OrchestratorError("PAYOUT_NOT_FOUND", { payoutId });

        if (payout.status !== "PROCESSING" && payout.status !== "REQUESTED") {
            throw new OrchestratorError("INVALID_PAYOUT_TRANSITION", { payoutId, from: payout.status, to: "SUCCEEDED" });
        }

        const ledgerTx = buildPayoutSucceededTransaction(payout);
        await transitionPayoutStatus(payoutId, "SUCCEEDED", ledgerTx);
    }

    /**
     * Reverts a failed payout.
     * Liability is returned to payoutable_balance.
     */
    async failPayout(payoutId: string, reason: string): Promise<void> {
        const payout = await findPayoutById(payoutId);
        if (!payout) throw new OrchestratorError("PAYOUT_NOT_FOUND", { payoutId });

        if (payout.status === "SUCCEEDED" || payout.status === "FAILED") {
            throw new OrchestratorError("PAYOUT_ALREADY_TERMINAL", { payoutId, status: payout.status });
        }

        const ledgerTx = buildPayoutFailedTransaction(payout);
        await transitionPayoutStatus(payoutId, "FAILED", ledgerTx);

        // Log failure for manual intervention
        console.error(`[PAYOUT_FAILED] ${payoutId}: ${reason}`);
    }
}

export const payoutOrchestrator = new PayoutOrchestrator();

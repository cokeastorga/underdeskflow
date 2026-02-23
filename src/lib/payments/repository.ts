/**
 * PaymentRepository — Firestore persistence layer for the Payment Orchestrator.
 *
 * All writes use Firestore batches/transactions for atomicity.
 * Optimistic locking via `version` field prevents concurrent state corruption.
 * payment_events is append-only — never update or delete records here.
 */
import { adminDb } from "@/lib/firebase/admin-config";
import {
    PaymentIntent,
    PaymentAttempt,
    PaymentEvent,
    OutboxEvent,
    Refund,
    LedgerTransaction,
    PaymentStatus,
    SupportedProvider,
    OutboxEventType,
    OrchestratorError,
    Payout,
} from "@/types/payments";
import { FieldValue, Transaction } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { statusToOutboxEvent } from "@/lib/payments/fsm";
import { buildEventIdempotencyKey } from "@/lib/payments/idempotency";
import { createHash } from "crypto";

const INTENTS_COL = "payment_intents";
const ATTEMPTS_COL = "payment_attempts";
const EVENTS_COL = "payment_events";
const OUTBOX_COL = "outbox_events";
const REFUNDS_COL = "payment_refunds";
const LEDGER_COL = "payment_ledger";
const PAYOUTS_COL = "payment_payouts";
const STORES_COL = "stores"; // Assuming store data (KYC status) lives here

// ─── Read Operations ──────────────────────────────────────────────────────────

export async function findIntentById(id: string): Promise<PaymentIntent | null> {
    const snap = await adminDb.collection(INTENTS_COL).doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as PaymentIntent;
}

export async function findIntentByIdempotencyKey(key: string): Promise<PaymentIntent | null> {
    const snap = await adminDb
        .collection(INTENTS_COL)
        .where("idempotency_key", "==", key)
        .limit(1)
        .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as PaymentIntent;
}

/** Find intent by provider's reference ID. */
export async function findIntentByProviderIntentId(
    providerIntentId: string
): Promise<PaymentIntent | null> {
    const snap = await adminDb
        .collection(INTENTS_COL)
        .where("provider_intent_id", "==", providerIntentId)
        .limit(1)
        .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as PaymentIntent;
}

/** For reconciliation jobs: find un-settled PENDING/AUTHORIZED intents past TTL. */
export async function findStaleIntents(olderThanMs: number): Promise<PaymentIntent[]> {
    const cutoff = Date.now() - olderThanMs;
    const snap = await adminDb
        .collection(INTENTS_COL)
        .where("status", "in", ["PENDING", "AUTHORIZED"])
        .where("updated_at", "<", cutoff)
        .limit(50)
        .get();
    return snap.docs.map(d => d.data() as PaymentIntent);
}

/** Find refunds stuck in PENDING status for reconciliation. */
export async function findPendingRefunds(olderThanMs: number): Promise<Refund[]> {
    const cutoff = Date.now() - olderThanMs;
    const snap = await adminDb
        .collection(REFUNDS_COL)
        .where("status", "==", "PENDING")
        .where("updated_at", "<", cutoff)
        .limit(50)
        .get();
    return snap.docs.map(d => d.data() as Refund);
}

/** Aggregates total amount for a store in a period (GMV). */
export async function sumIntentsByStore(
    storeId: string,
    start: number,
    end: number
): Promise<{ gmv: number; count: number }> {
    const snap = await adminDb
        .collection(INTENTS_COL)
        .where("store_id", "==", storeId)
        .where("status", "in", ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"])
        .where("created_at", ">=", start)
        .where("created_at", "<=", end)
        .get();

    let gmv = 0;
    snap.docs.forEach(doc => {
        gmv += (doc.data() as PaymentIntent).amount;
    });

    return { gmv, count: snap.size };
}

/** Aggregates total refund volume for a store in a period. */
export async function sumRefundsByStore(
    storeId: string,
    start: number,
    end: number
): Promise<number> {
    const snap = await adminDb
        .collection(REFUNDS_COL)
        .where("store_id", "==", storeId)
        .where("status", "==", "SUCCEEDED")
        .where("created_at", ">=", start)
        .where("created_at", "<=", end)
        .get();

    let total = 0;
    snap.docs.forEach(doc => {
        total += (doc.data() as Refund).amount;
    });

    return total;
}

export async function isEventAlreadyProcessed(rawEventId: string): Promise<boolean> {
    const key = buildEventIdempotencyKey(rawEventId);
    const snap = await adminDb
        .collection(EVENTS_COL)
        .where("idempotency_key", "==", key)
        .limit(1)
        .get();
    return !snap.empty;
}

/** Find unpublished outbox events (for the outbox worker). */
export async function findUnpublishedOutboxEvents(limit = 20): Promise<OutboxEvent[]> {
    const snap = await adminDb
        .collection(OUTBOX_COL)
        .where("published_at", "==", null)
        .orderBy("created_at", "asc")
        .limit(limit)
        .get();
    return snap.docs.map(d => d.data() as OutboxEvent);
}

/** 
 * Find Payout by ID.
 */
export async function findPayoutById(id: string): Promise<Payout | null> {
    const snap = await adminDb.collection(PAYOUTS_COL).doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as Payout;
}

/**
 * Aggregates the available balance for a store by summing all ledger entries.
 * This is the ultimate source of truth for payout eligibility.
 * 
 * Safety Guardrail: maturityWindowHours (T+24h default)
 * Only funds that have "matured" (settled long enough to reduce fraud/chargeback risk)
 * are included in the payoutable calculation.
 */
export async function calculatePayoutableBalance(
    storeId: string,
    maturityWindowHours: number = 24
): Promise<number> {
    const maturityCutoff = Date.now() - (maturityWindowHours * 60 * 60 * 1000);

    const snap = await adminDb
        .collection(LEDGER_COL)
        .where("store_id", "==", storeId)
        .where("created_at", "<=", maturityCutoff)
        .get();

    let balance = 0;
    snap.docs.forEach(doc => {
        const tx = doc.data() as LedgerTransaction;
        // Optimization: We could use Firestore aggregation queries if the ledger grows huge,
        // but for high integrity, we sum the entries here to ensure account precision.
        tx.entries.forEach(entry => {
            if (entry.account === "payoutable_balance") {
                balance += entry.amount;
            }
        });
    });

    return balance;
}

/** Check for existing payout with the same idempotency key. */
export async function findPayoutByIdempotencyKey(key: string): Promise<Payout | null> {
    const snap = await adminDb
        .collection(PAYOUTS_COL)
        .where("idempotency_key", "==", key)
        .limit(1)
        .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as Payout;
}

// ─── Write Operations ─────────────────────────────────────────────────────────

export async function createIntent(intent: Omit<PaymentIntent, "created_at" | "updated_at" | "version">): Promise<PaymentIntent> {
    const now = Date.now();
    const full: PaymentIntent = {
        ...intent,
        created_at: now,
        updated_at: now,
        version: 1,
    };
    await adminDb.collection(INTENTS_COL).doc(full.id).set(full);
    return full;
}

export async function saveAttempt(attempt: Omit<PaymentAttempt, "id">): Promise<void> {
    const id = uuidv4();
    await adminDb.collection(ATTEMPTS_COL).doc(id).set({ id, ...attempt });
}

/**
 * Atomically transitions the intent status with optimistic locking + appends
 * the event to the event log + enqueues an outbox event.
 *
 * Returns the updated intent, or throws OrchestratorError("OPTIMISTIC_LOCK_CONFLICT")
 * if another process modified the intent between read and write.
 */
export async function transitionStatus(
    intent: PaymentIntent,
    newStatus: PaymentStatus,
    rawEventId: string | null,
    eventPayload: Record<string, unknown>,
    source: PaymentEvent["source"] = "provider",
    ledgerTx?: LedgerTransaction
): Promise<PaymentIntent> {
    const intentRef = adminDb.collection(INTENTS_COL).doc(intent.id);
    const eventRef = adminDb.collection(EVENTS_COL).doc(uuidv4());
    const outboxRef = adminDb.collection(OUTBOX_COL).doc(uuidv4());
    const ledgerRef = ledgerTx ? adminDb.collection(LEDGER_COL).doc(ledgerTx.id) : null;
    const now = Date.now();

    const outboxType = statusToOutboxEvent(newStatus);

    await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(intentRef);
        const current = snap.data() as PaymentIntent;

        // Optimistic locking: fail if someone else changed it
        if (current.version !== intent.version) {
            throw new OrchestratorError("OPTIMISTIC_LOCK_CONFLICT", {
                intent_id: intent.id,
                expected_version: intent.version,
                actual_version: current.version,
            });
        }

        // Update intent
        tx.update(intentRef, {
            status: newStatus,
            updated_at: now,
            version: FieldValue.increment(1),
        });

        // Append event (immutable)
        const eventIdempotencyKey = rawEventId
            ? buildEventIdempotencyKey(rawEventId)
            : buildEventIdempotencyKey(`${intent.id}-${newStatus}-${now}`);

        const checksum = createHash("sha256")
            .update(`${intent.id}:${intent.status}:${newStatus}:${JSON.stringify(eventPayload)}`)
            .digest("hex");

        const event: PaymentEvent = {
            id: eventRef.id,
            payment_intent_id: intent.id,
            store_id: intent.store_id,
            event_type: "status.transition",
            source,
            provider: intent.provider,
            raw_event_id: rawEventId,
            old_status: intent.status,
            new_status: newStatus,
            payload: eventPayload,
            checksum,
            idempotency_key: eventIdempotencyKey,
            processed_at: now,
        };
        tx.set(eventRef, event);

        // Enqueue outbox event (same transaction — atomicity guaranteed)
        if (outboxType) {
            const outbox: OutboxEvent = {
                id: outboxRef.id,
                aggregate_type: "payment_intent",
                aggregate_id: intent.id,
                event_type: outboxType,
                payload: {
                    intent_id: intent.id,
                    order_id: intent.order_id,
                    store_id: intent.store_id,
                    amount: intent.amount,
                    currency: intent.currency,
                    provider: intent.provider,
                    old_status: intent.status,
                    new_status: newStatus,
                    ...eventPayload,
                },
                created_at: now,
                published_at: null,
            };
            tx.set(outboxRef, outbox);
        }

        // Save Ledger entries (if any)
        if (ledgerRef && ledgerTx) {
            tx.set(ledgerRef, ledgerTx);

            // Also enqueue outbox for ledger sync if needed
            const ledgerOutboxRef = adminDb.collection(OUTBOX_COL).doc(uuidv4());
            const ledgerOutbox: OutboxEvent = {
                id: ledgerOutboxRef.id,
                aggregate_type: "payment_intent",
                aggregate_id: intent.id,
                event_type: "LEDGER_SYNC",
                payload: {
                    ledger_transaction: ledgerTx,
                },
                created_at: now,
                published_at: null,
            };
            tx.set(ledgerOutboxRef, ledgerOutbox);
        }
    });

    return { ...intent, status: newStatus, version: intent.version + 1, updated_at: now };
}

/** Marks an outbox event as published. */
export async function markOutboxEventPublished(id: string): Promise<void> {
    await adminDb.collection(OUTBOX_COL).doc(id).update({ published_at: Date.now() });
}

/** Appends a raw event log entry without changing intent status (for dedup/ignored events). */
export async function appendEvent(
    intent: PaymentIntent,
    type: PaymentEvent["event_type"],
    rawEventId: string | null,
    payload: Record<string, unknown>,
    source: PaymentEvent["source"] = "system"
): Promise<void> {
    const id = uuidv4();
    const event: PaymentEvent = {
        id,
        payment_intent_id: intent.id,
        store_id: intent.store_id,
        event_type: type,
        source,
        provider: intent.provider,
        raw_event_id: rawEventId,
        old_status: null,
        new_status: null,
        payload,
        idempotency_key: rawEventId
            ? buildEventIdempotencyKey(rawEventId)
            : buildEventIdempotencyKey(`${intent.id}-${type}-${Date.now()}`),
        processed_at: Date.now(),
    };

    // Calculate checksum for non-transition events too
    (event as any).checksum = createHash("sha256")
        .update(`${intent.id}:NONE:${type}:${JSON.stringify(payload)}`)
        .digest("hex");

    await adminDb.collection(EVENTS_COL).doc(id).set(event);
}

/** Updates provider_intent_id after PSP initialization (in CREATED → PENDING flow). */
export async function updateProviderRef(
    intentId: string,
    providerIntentId: string,
    clientUrl: string | null,
    clientSecret: string | null
): Promise<void> {
    await adminDb.collection(INTENTS_COL).doc(intentId).update({
        provider_intent_id: providerIntentId,
        client_url: clientUrl,
        client_secret: clientSecret,
        updated_at: Date.now(),
    });
}

/** Explicitly save a ledger transaction — used when called outside transitionStatus */
export async function saveLedgerTransaction(
    ledgerTx: LedgerTransaction,
    tx?: Transaction
): Promise<void> {
    const ref = adminDb.collection(LEDGER_COL).doc(ledgerTx.id);
    if (tx) {
        tx.set(ref, ledgerTx);
    } else {
        await ref.set(ledgerTx);
    }
}

// ── Refund Operations ────────────────────────────────────────────────────────────

/**
 * Persist a Refund record.
 * @param tx Optional Firestore transaction — should be provided when calling
 *           from within the orchestrator's atomic refund write.
 */
export async function saveRefund(
    refund: Refund,
    tx?: Transaction
): Promise<void> {
    const ref = adminDb.collection(REFUNDS_COL).doc(refund.id);
    if (tx) {
        tx.set(ref, refund);
    } else {
        await ref.set(refund);
    }
}

/** Find a refund by its idempotency key (used for deduplication). */
export async function findRefundByIdempotencyKey(
    key: string
): Promise<Refund | null> {
    const snap = await adminDb
        .collection(REFUNDS_COL)
        .where("idempotency_key", "==", key)
        .limit(1)
        .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as Refund;
}

/** List all ledger transactions for a store within a period. */
export async function queryLedgerTransactions(
    storeId: string,
    start: number,
    end: number
): Promise<LedgerTransaction[]> {
    const snap = await adminDb
        .collection(LEDGER_COL)
        .where("store_id", "==", storeId)
        .where("created_at", ">=", start)
        .where("created_at", "<=", end)
        .get();

    return snap.docs.map(d => d.data() as LedgerTransaction);
}

/** List all refund records for a given payment intent (for the API GET /refunds route). */
export async function findRefundsByIntentId(intentId: string): Promise<Refund[]> {
    const snap = await adminDb
        .collection(REFUNDS_COL)
        .where("payment_intent_id", "==", intentId)
        .orderBy("created_at", "asc")
        .get();
    return snap.docs.map(d => d.data() as Refund);
}

/**
 * Atomically:
 *   1. Increments intent.refunded_amount + intent.refund_count
 *   2. Transitions intent.status via FSM (PAID → PARTIALLY_REFUNDED or REFUNDED)
 *   3. Appends event + outbox entry
 *
 * Must be called inside an existing Firestore transaction (the same tx used
 * to saveRefund) to guarantee all-or-nothing semantics.
 */
export async function updateIntentRefundTotals(
    intent: PaymentIntent,
    refundAmount: number,
    newStatus: PaymentStatus,
    eventPayload: Record<string, unknown>,
    tx: Transaction,
    ledgerTx?: LedgerTransaction
): Promise<void> {
    const intentRef = adminDb.collection(INTENTS_COL).doc(intent.id);
    const eventRef = adminDb.collection(EVENTS_COL).doc(uuidv4());
    const outboxRef = adminDb.collection(OUTBOX_COL).doc(uuidv4());
    const ledgerRef = ledgerTx ? adminDb.collection(LEDGER_COL).doc(ledgerTx.id) : null;
    const now = Date.now();

    // Optimistic locking: re-read inside the transaction
    const snap = await tx.get(intentRef);
    const current = snap.data() as PaymentIntent;
    if (current.version !== intent.version) {
        throw new OrchestratorError("OPTIMISTIC_LOCK_CONFLICT", {
            intent_id: intent.id,
            expected_version: intent.version,
            actual_version: current.version,
        });
    }

    // Update intent totals + status
    tx.update(intentRef, {
        status: newStatus,
        refunded_amount: FieldValue.increment(refundAmount),
        refund_count: FieldValue.increment(1),
        updated_at: now,
        version: FieldValue.increment(1),
    });

    // Append event (immutable audit log)
    const checksum = createHash("sha256")
        .update(`${intent.id}:${intent.status}:${newStatus}:${JSON.stringify(eventPayload)}`)
        .digest("hex");

    const event: PaymentEvent = {
        id: eventRef.id,
        payment_intent_id: intent.id,
        store_id: intent.store_id,
        event_type: "refund.completed",
        source: "operator",
        provider: intent.provider,
        raw_event_id: null,
        old_status: intent.status,
        new_status: newStatus,
        payload: eventPayload,
        checksum,
        idempotency_key: buildEventIdempotencyKey(
            `${intent.id}-refund-${eventPayload.refund_id}-${now}`
        ),
        processed_at: now,
    };
    tx.set(eventRef, event);

    // Enqueue outbox event for order/stock reversal
    const outboxType = statusToOutboxEvent(newStatus);
    if (outboxType) {
        const outbox: OutboxEvent = {
            id: outboxRef.id,
            aggregate_type: "payment_intent",
            aggregate_id: intent.id,
            event_type: outboxType,
            payload: {
                intent_id: intent.id,
                order_id: intent.order_id,
                store_id: intent.store_id,
                amount: intent.amount,
                refund_amount: refundAmount,
                currency: intent.currency,
                provider: intent.provider,
                old_status: intent.status,
                new_status: newStatus,
                ...eventPayload,
            },
            created_at: now,
            published_at: null,
        };
        tx.set(outboxRef, outbox);
    }
}

/**
 * Atomically saves a Payout record and its initial ledger transaction.
 */
export async function savePayout(
    payout: Payout,
    ledgerTx: LedgerTransaction
): Promise<void> {
    const payoutRef = adminDb.collection(PAYOUTS_COL).doc(payout.id);
    const ledgerRef = adminDb.collection(LEDGER_COL).doc(ledgerTx.id);
    const outboxRef = adminDb.collection(OUTBOX_COL).doc(uuidv4());

    await adminDb.runTransaction(async (tx) => {
        tx.set(payoutRef, payout);
        tx.set(ledgerRef, ledgerTx);

        // Enqueue outbox if requested (to trigger external bank API)
        if (payout.status === "REQUESTED") {
            const outbox: OutboxEvent = {
                id: outboxRef.id,
                aggregate_type: "payout",
                aggregate_id: payout.id,
                event_type: "PAYOUT_REQUESTED",
                payload: {
                    payout_id: payout.id,
                    store_id: payout.store_id,
                    amount: payout.amount,
                    currency: payout.currency,
                    bank: payout.bank_snapshot
                },
                created_at: Date.now(),
                published_at: null,
            };
            tx.set(outboxRef, outbox);
        }
    });
}

/**
 * Transition Payout status and record ledger movement.
 */
export async function transitionPayoutStatus(
    payoutId: string,
    newStatus: Payout["status"],
    ledgerTx: LedgerTransaction
): Promise<void> {
    const payoutRef = adminDb.collection(PAYOUTS_COL).doc(payoutId);
    const ledgerRef = adminDb.collection(LEDGER_COL).doc(ledgerTx.id);

    await adminDb.runTransaction(async (tx) => {
        tx.update(payoutRef, {
            status: newStatus,
            updated_at: Date.now()
        });
        tx.set(ledgerRef, ledgerTx);
    });
}

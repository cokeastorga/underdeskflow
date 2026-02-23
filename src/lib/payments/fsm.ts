/**
 * Payment FSM — Pure module, zero side effects.
 * Imports nothing from infrastructure layers.
 *
 * This is the single source of truth for what state transitions are allowed.
 */
import { PaymentStatus, OutboxEventType } from "@/types/payments";

// Allowed transitions: from → Set<to>
export const ALLOWED_TRANSITIONS: Record<PaymentStatus, Set<PaymentStatus>> = {
    CREATED: new Set(["PENDING", "CANCELED"]),
    PENDING: new Set(["AUTHORIZED", "PAID", "FAILED", "CANCELED"]),
    AUTHORIZED: new Set(["PAID", "FAILED", "CANCELED"]),
    PAID: new Set(["REFUNDED", "PARTIALLY_REFUNDED"]),
    PARTIALLY_REFUNDED: new Set(["REFUNDED", "PARTIALLY_REFUNDED"]), // self-loop for multiple partials
    FAILED: new Set(),   // Terminal
    CANCELED: new Set(),   // Terminal
    REFUNDED: new Set(),   // Terminal
};

// PARTIALLY_REFUNDED is NOT terminal — more refunds may follow until REFUNDED.
export const TERMINAL_STATES = new Set<PaymentStatus>(["FAILED", "CANCELED", "REFUNDED"]);

/** States that can accept a refund operation */
export const REFUNDABLE_STATES = new Set<PaymentStatus>(["PAID", "PARTIALLY_REFUNDED"]);

export function isValidTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    return ALLOWED_TRANSITIONS[from]?.has(to) ?? false;
}

export function isTerminal(status: PaymentStatus): boolean {
    return TERMINAL_STATES.has(status);
}

export function isRefundable(status: PaymentStatus): boolean {
    return REFUNDABLE_STATES.has(status);
}

/**
 * FSM-level refund invariant guard.
 * Throws if the refund would violate: sum(refunds) <= intent.amount
 *
 * This is a pure function — no I/O. Called before any Firestore writes.
 * Even if the orchestrator forgets to check, the FSM layer catches it.
 */
export function assertRefundInvariant(
    intentAmount: number,
    currentRefundedAmount: number,
    newRefundAmount: number
): void {
    const total = currentRefundedAmount + newRefundAmount;
    if (total > intentAmount) {
        throw new Error(
            `FSM refund invariant violated: ` +
            `refunded(${currentRefundedAmount}) + new(${newRefundAmount}) = ${total} ` +
            `exceeds intent.amount(${intentAmount})`
        );
    }
    if (newRefundAmount <= 0) {
        throw new Error(`FSM refund invariant violated: refund amount must be > 0, got ${newRefundAmount}`);
    }
}

/** Maps a new status to the outbox event type to emit. */
export function statusToOutboxEvent(status: PaymentStatus): OutboxEventType | null {
    const map: Partial<Record<PaymentStatus, OutboxEventType>> = {
        CREATED: "PAYMENT_CREATED",
        PENDING: "PAYMENT_PENDING",
        AUTHORIZED: "PAYMENT_AUTHORIZED",
        PAID: "PAYMENT_PAID",
        FAILED: "PAYMENT_FAILED",
        CANCELED: "PAYMENT_CANCELED",
        REFUNDED: "PAYMENT_REFUNDED",
        PARTIALLY_REFUNDED: "PAYMENT_PARTIALLY_REFUNDED",
    };
    return map[status] ?? null;
}

/**
 * Returns the FSM graph as a plain object (useful for debugging/observability dashboards).
 */
export function getFsmGraph(): Record<string, string[]> {
    return Object.fromEntries(
        Object.entries(ALLOWED_TRANSITIONS).map(([from, tos]) => [from, [...tos]])
    );
}

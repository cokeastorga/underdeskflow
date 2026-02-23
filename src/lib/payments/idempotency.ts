import { createHash } from "crypto";
import { PaymentIntent, PaymentStatus, OrchestratorError } from "@/types/payments";

/**
 * Per-intent idempotency key — hashes store+order+amount+currency.
 * Same inputs always produce the same intent, preventing duplicate charges.
 */
export function buildIntentIdempotencyKey(
    store_id: string,
    order_id: string,
    amount: number,
    currency: string
): string {
    return createHash("sha256")
        .update(`${store_id}:${order_id}:${amount}:${currency.toUpperCase()}`)
        .digest("hex");
}

/**
 * Per-event idempotency key — hashes the PSP event ID.
 * Ensures each webhook event is processed exactly once.
 */
export function buildEventIdempotencyKey(provider_event_id: string): string {
    return createHash("sha256")
        .update(`event:${provider_event_id}`)
        .digest("hex");
}

/**
 * Order-level lock key — prevents two concurrent intents for the same order.
 * Stored separately from intent idempotency (amount could legitimately change on retry).
 */
export function buildOrderLockKey(store_id: string, order_id: string): string {
    return `order_lock:${store_id}:${order_id}`;
}

export type IdempotencyResolution =
    | { action: "create" }
    | { action: "reuse"; intent: PaymentIntent }
    | { action: "reject"; reason: string };

/**
 * Given an existing intent (or null), determines whether to:
 * - create a brand new intent
 * - reuse the existing one (return it directly)
 * - reject the request (order already PAID)
 *
 * This is the ONLY place where this decision is made.
 */
export function resolveIdempotency(
    existing: PaymentIntent | null
): IdempotencyResolution {
    if (!existing) return { action: "create" };

    const reuseStates = new Set<PaymentStatus>(["CREATED", "PENDING", "AUTHORIZED"]);
    const createNewStates = new Set<PaymentStatus>(["FAILED", "CANCELED"]);

    if (existing.status === "PAID" || existing.status === "REFUNDED") {
        throw new OrchestratorError("INTENT_ALREADY_PAID", {
            intent_id: existing.id,
            status: existing.status,
            order_id: existing.order_id,
        });
    }

    if (reuseStates.has(existing.status)) {
        return { action: "reuse", intent: existing };
    }

    if (createNewStates.has(existing.status)) {
        return { action: "create" };
    }

    // Safety net — should never reach here if FSM is consistent
    throw new OrchestratorError("IDEMPOTENCY_CONFLICT", {
        intent_id: existing.id,
        status: existing.status,
    });
}

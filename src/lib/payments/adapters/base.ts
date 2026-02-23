import {
    PaymentIntent,
    CreatePaymentResult,
    ParsedWebhookEvent,
    ProviderStatus,
    PaymentStatus,
    SupportedProvider,
    RefundStatus,
    RefundAdapterResult,
    RefundReason,
    StatusResult,
    RefundStatusResult,
} from "@/types/payments";

/**
 * PaymentProviderAdapter — The contract every PSP integration must fulfil.
 *
 * Rules:
 * 1. Never store or log PAN, CVV, or any PCI-scoped data.
 * 2. Always pass internal idempotency keys to the PSP when supported.
 * 3. parseWebhook() must throw if the signature is invalid — the orchestrator
 *    will return 400 and log a security alert.
 * 4. normalizeStatus() must be a pure mapping — no I/O, no side effects.
 * 5. refund() must NEVER return FAILED — throw OrchestratorError instead.
 */
export interface PaymentProviderAdapter {
    readonly providerId: SupportedProvider;

    /**
     * Initialize the payment at the PSP.
     * Returns the PSP's reference ID and whatever the frontend needs.
     */
    createPayment(intent: PaymentIntent): Promise<CreatePaymentResult>;


    /**
     * Validate the webhook signature and parse the event.
     * Must throw if signature is invalid.
     */
    parseWebhook(
        rawBody: Buffer,
        headers: Record<string, string | string[] | undefined>
    ): Promise<ParsedWebhookEvent>;

    /**
     * Pure mapping: PSP-native status → internal PaymentStatus.
     * No I/O, no side effects.
     */
    normalizeStatus(providerStatus: string): PaymentStatus;

    /**
     * Issue a (partial or full) refund at the PSP.
     *
     * Provider sync model:
     *   Stripe      — Sync. application_fee reversed automatically by Stripe
     *                 in Direct Charge model. Do NOT send refund_application_fee
     *                 (deprecated param causes double-reversal).
     *   MercadoPago — Async. Returns PENDING; PSP webhook confirms via payment.updated.
     *   Flow        — Async. Returns PENDING; reconciliation job polls getStatus.
     *   Webpay      — Sync, but only within same-day window (<21:00 UTC-3).
     *                 The orchestrator handles out-of-window BEFORE calling this
     *                 method (creates PENDING_MANUAL instead).
     *
     * @throws OrchestratorError("REFUND_PROVIDER_FAILED") on hard PSP rejection.
     */
    refund(params: RefundParams): Promise<RefundAdapterResult>;

    /**
     * Reconcile: Query current status of a payment intent directly from PSP.
     */
    queryStatus(providerIntentId: string): Promise<StatusResult>;

    /**
     * Reconcile: Query current status of a refund directly from PSP.
     */
    queryRefundStatus(providerRefundId: string): Promise<RefundStatusResult>;
}

/** Parameters passed to adapter.refund() */
export interface RefundParams {
    providerIntentId: string;
    amount: number;          // CLP entero — amount to refund in smallest unit
    currency: string;
    reason: RefundReason;
    idempotencyKey: string;  // Forward to PSP where supported (avoids double-refund on retry)
    isFullRefund: boolean;
}

/** Shared PCI scrubber — removes sensitive fields before logging/persisting. */
export function scrubPci(payload: Record<string, unknown>): Record<string, unknown> {
    const SENSITIVE = new Set([
        "card_number", "cvv", "cvc", "pan", "number",
        "password", "secret", "token", "client_secret",
    ]);
    return Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [
            k,
            SENSITIVE.has(k.toLowerCase()) ? "[REDACTED]" : v,
        ])
    );
}

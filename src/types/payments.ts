// ─────────────────────────────────────────────────────────────────────────────
// Payment Orchestrator — Domain Types
// ─────────────────────────────────────────────────────────────────────────────

// ── FSM States ───────────────────────────────────────────────────────────────

export type PaymentStatus =
    | "CREATED"
    | "PENDING"
    | "AUTHORIZED"
    | "PAID"
    | "PARTIALLY_REFUNDED"     // Has at least one partial refund; more may follow
    | "FAILED"
    | "CANCELED"
    | "REFUNDED";              // Full refund complete (terminal)

// ── ACCOUNTING LEDGER (Double-Entry) ────────────────────────────────────────

/** Accounts in our double-entry ledger */
export type LedgerAccount =
    | "payoutable_balance"     // Funds owed to the tenant (net of fees)
    | "platform_commissions"   // Earned platform revenue
    | "psp_pending"            // Funds held by PSP (not yet paid out to us)
    | "refund_reserve"         // Funds earmarked/processed for refunds
    | "payout_liability"      // Funds earmarked for merchant payout (in-flight)
    | "channel_commission";    // External market commission (ML, Shopify, etc.)

export type LedgerEntryType = "DEBIT" | "CREDIT";

/** A single ledger movement */
export interface LedgerEntry {
    id: string;
    account: LedgerAccount;
    amount: number;            // CLP (positive/negative based on type)
    type: LedgerEntryType;
    currency: string;
}

/** Whether the sale originated in the merchant's own store or an external channel */
export type OrderSource = "OWN_STORE" | "EXTERNAL_CHANNEL";

/** A group of entries that must sum to zero (Debits + Credits = 0) */
export interface LedgerTransaction {
    id: string;
    payment_intent_id?: string; // Optional (Payouts don't link to a single intent)
    store_id: string;          // Denormalized for reporting
    reference_id: string;      // attempt_id, refund_id, or payout_id
    /**
     * Where this sale originated.
     * OWN_STORE → 8% platform fee applied.
     * EXTERNAL_CHANNEL → 0% platform fee (merchant pays channel's own commission).
     */
    order_source: OrderSource;
    type:
    | "PAYMENT_PAID"
    | "EXTERNAL_ORDER_RECEIVED"  // Order from external channel — no platform fee
    | "REFUND_SUCCEEDED"
    | "COMMISSION_REVERSAL"
    | "PAYOUT_REQUESTED"
    | "PAYOUT_PROCESSING"
    | "PAYOUT_SUCCEEDED"
    | "PAYOUT_FAILED";
    description: string;
    entries: LedgerEntry[];
    channel_type?: string;     // For enterprise channel attribution
    metadata?: Record<string, unknown>;
    created_at: number;
}

// ── TECHNICAL REPORTING (Analytics) ──────────────────────────────────────────

export interface ReportingPeriod {
    start: number; // UTC timestamp
    end: number;   // UTC timestamp
}

export interface TenantReport {
    store_id: string;
    period: ReportingPeriod;
    currency: string;

    // Commercial metrics (from Intents/Refunds)
    gmv: number;               // Gross Merchandise Volume (sales before refunds)
    refund_volume: number;     // Sum of processed refunds (operational)
    refund_rate: number;       // refund_volume / gmv

    // Financial metrics (aggregated from Ledger)
    platform_fees: number;     // Net commissions (Credits - Debits)
    net_payoutable: number;    // Net funds for tenant (Credits - Debits)

    // Auditability
    ledger_checksum: string;   // Hash of entries used (to detect staleness/tampering)
    generated_at: number;
}

export interface PlatformReport {
    period: ReportingPeriod;
    total_gmv: number;         // Aggregate GMV across all tenants
    total_commissions: number; // Aggregate Platform Revenue
    merchant_payout_liability: number; // sum of payoutable_balance across all tenants
    psp_transit_balance: number;       // total held in psp_pending
    active_tenants_count: number;
    generated_at: number;
}

// ── Core Aggregates ──────────────────────────────────────────────────────────

export interface PaymentIntent {
    id: string;                             // UUID v4 — internal ref, globally unique
    store_id: string;
    order_id: string;
    idempotency_key: string;                // SHA256(store_id:order_id:amount:currency)
    amount: number;                         // Smallest currency unit (centavos, CLP entero)
    currency: string;                       // ISO 4217
    country: string;                        // ISO 3166-1 alpha-2
    payment_method: PaymentMethod;
    provider: SupportedProvider;
    provider_intent_id: string | null;      // External PSP reference
    status: PaymentStatus;
    client_url: string | null;             // Redirect URL (Webpay, Flow)
    client_secret: string | null;          // Ephemeral token (Stripe, MP)
    expires_at: number;                    // Unix ms
    metadata: Record<string, string>;
    created_at: number;                    // Unix ms
    updated_at: number;                    // Unix ms
    version: number;                       // Optimistic locking counter

    // ── Refund totals ───────────────────────────────────────────────────
    // Invariant (enforced in FSM guard): refunded_amount <= amount, always.
    // Updated atomically alongside FSM transitions via Firestore transaction.
    refunded_amount: number;               // Running sum of confirmed refunds
    refund_count: number;                  // Number of refund records (for dashboard)

    // ── Stripe Connect — Direct Charge model ───────────────────────────
    // Populated server-side from the store document. Never from client input.
    connect_account_id: string | null;     // Tenant's Stripe acc_xxx
    platform_fee_amount: number | null;    // Math.round(amount * rate), CLP int

    // ── Commission snapshot (immutable at charge time) ───────────────────
    // Preserved for audit even when rates change.
    commission: CommissionConfig | null;
}

/**
 * Versioned commission configuration snapshot.
 * Stored immutably on the PaymentIntent at creation time.
 *
 * Fields:
 *   rate    — decimal (e.g. 0.03 = 3%)
 *   fee     — computed amount in the payment's currency unit
 *   min_fee — floor: no charge falls below this (avoids micro-refunds)
 *   max_fee — ceiling: protects tenants on large orders
 *   version — label for the rate schedule in effect (e.g. "v1", "v2")
 *
 * CLP note: all amounts are integers (CLP has no cents).
 */
export interface CommissionConfig {
    rate: number;         // 0.03
    fee: number;          // Math.round(amount * rate), already clamped
    min_fee: number;      // e.g. 190  CLP (~$0.20 USD)
    max_fee: number;      // e.g. 49990 CLP (~$50 USD)
    version: string;      // "v1" — increment when rates change
}

export interface PaymentAttempt {
    id: string;
    payment_intent_id: string;
    provider: SupportedProvider;
    provider_attempt_id: string | null;
    status_raw: string;                  // Un-normalized PSP status
    request_payload: Record<string, unknown>;   // PCI-scrubbed before storing
    response_payload: Record<string, unknown>;  // PCI-scrubbed before storing
    http_status: number | null;
    error_code: string | null;
    error_message: string | null;
    duration_ms: number;
    created_at: number;
}

export interface PaymentEvent {
    id: string;
    payment_intent_id: string;
    store_id: string;                    // Denormalized for efficient per-tenant audit/rebuild
    event_type: PaymentEventType;
    source: "system" | "provider" | "operator";
    provider: SupportedProvider | null;
    raw_event_id: string | null;         // PSP event ID — used for deduplication
    old_status: PaymentStatus | null;
    new_status: PaymentStatus | null;
    payload: Record<string, unknown>;    // Full event snapshot
    checksum?: string;                  // SHA256(intent_id:old_status:new_status:payload)
    idempotency_key: string;             // SHA256 of raw_event_id or unique action
    processed_at: number;               // Unix ms
}

export interface OutboxEvent {
    id: string;
    aggregate_type: "payment_intent" | "payout";
    aggregate_id: string;               // UUID of the aggregate
    event_type: OutboxEventType;
    payload: Record<string, unknown>;
    created_at: number;
    published_at: number | null;        // null = not yet published
}

// ── Enumerations ─────────────────────────────────────────────────────────────

export type SupportedProvider = "stripe" | "mercadopago" | "flow" | "webpay";

export type PaymentMethod = "card" | "bank_transfer" | "wallet" | "cash";

export type PaymentEventType =
    | "intent.created"
    | "provider.initialized"
    | "provider.init_failed"
    | "webhook.received"
    | "webhook.deduped"
    | "webhook.ignored_out_of_order"
    | "status.transition"
    | "refund.initiated"
    | "refund.completed"
    | "reconciliation.corrected";

export type OutboxEventType =
    | "PAYMENT_CREATED"
    | "PAYMENT_PENDING"
    | "PAYMENT_AUTHORIZED"
    | "PAYMENT_PAID"
    | "PAYMENT_FAILED"
    | "PAYMENT_CANCELED"
    | "PAYMENT_REFUNDED"
    | "PAYMENT_PARTIALLY_REFUNDED"
    | "PAYOUT_REQUESTED"       // Trigger for bank transfer execution
    | "PAYOUT_FAILED"          // Notification for operations
    | "LEDGER_SYNC";           // For accounting exports
// Triggers partial stock/order reversal

// ── Refund Domain ────────────────────────────────────────────────────────────

export type RefundReason =
    | "duplicate"
    | "fraudulent"
    | "requested_by_customer"
    | "order_canceled"
    | "other";

/**
 * RefundStatus lifecycle:
 *
 *  PENDING         — PSP accepted, waiting for confirmation (MP, Flow)
 *  PENDING_MANUAL  — Cannot process via PSP (e.g. Webpay out-of-window).
 *                    Requires manual bank transfer. Tracked for audit/compliance.
 *  SUCCEEDED       — PSP confirmed refund
 *  FAILED          — PSP rejected (insufficient funds, policy violation, etc.)
 *  CANCELED        — Voided before PSP processing
 */
export type RefundStatus =
    | "PENDING"
    | "PENDING_APPROVAL"     // Security: requires dual-control review
    | "PENDING_MANUAL"       // FSM-terminal: needs bank transfer
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELED";

// ── STORE COMPLIANCE (KYC-lite) ──────────────────────────────────────────────

export type StoreStatus =
    | "ACTIVE"                 // Normal operations
    | "SUSPENDED"              // Fraud/Security freeze (no payouts)
    | "KYC_PENDING";           // Missing documentation or onboarding

// ── PAYOUTS ──────────────────────────────────────────────────────────────────

export type PayoutStatus =
    | "REQUESTED"              // Initial request, funds earmarked (liability)
    | "PROCESSING"             // Sent to bank, awaiting settlement
    | "SUCCEEDED"              // Confirmed settlement
    | "FAILED";                 // Transfer failed (needs reversal)

export interface Payout {
    id: string;
    store_id: string;
    amount: number;
    currency: string;
    status: PayoutStatus;

    // Bank Snapshot (Immutable after request)
    bank_snapshot: {
        bank_name: string;
        bank_account_number: string;
        bank_account_type: string;
        bank_entity_id: string;    // RUT/Tax ID
    };

    idempotency_key: string;
    processed_at: number | null;
    created_at: number;
    updated_at: number;
}

export interface Refund {
    id: string;                          // UUID v4
    payment_intent_id: string;
    store_id: string;                    // Denormalized for reporting
    idempotency_key: string;             // SHA256(intent_id:amount:reason:operator_id)
    amount: number;                      // CLP entero — amount being refunded
    currency: string;
    reason: RefundReason;
    status: RefundStatus;
    provider: SupportedProvider;
    provider_refund_id: string | null;   // PSP-assigned refund ID (null until confirmed)

    // Commission reversal snapshot
    // refund_fee = Math.round(commission.fee × (amount / intent.amount))
    // For Stripe: Stripe reverses application_fee automatically — we only record.
    // For MP/Flow: sent explicitly in the refund API call.
    refund_fee: number;
    commission_version: string;          // commission.version at time of original charge

    is_full_refund: boolean;             // true when amount == intent.amount
    note: string | null;                 // Internal operator note
    initiated_by: string;               // UID of the operator
    created_at: number;
    updated_at: number;
}

/** Request payload from the operator API */
export interface RefundRequest {
    amount: number;                      // Must be validated server-side against remaining
    reason: RefundReason;
    note?: string;
}

/** Result returned by orchestrator.refund() */
export interface RefundResult {
    refund: Refund;
    new_intent_status: PaymentStatus;    // What the PaymentIntent transitioned to
    is_pending_manual: boolean;          // True for Webpay out-of-window
}

/** What a provider adapter returns from its refund() call */
export interface RefundAdapterResult {
    provider_refund_id: string | null;
    status: RefundStatus;                // PENDING or SUCCEEDED (adapters never return FAILED without throwing)
    is_async: boolean;                   // true for MP, Flow (webhook/polling needed)
}

export interface StatusResult {
    status: PaymentStatus;
    amount: number;
    currency: string;
    raw: unknown;
}

export interface RefundStatusResult {
    status: RefundStatus;
    amount: number;
    currency: string;
    raw: unknown;
}

// ── API Contracts ─────────────────────────────────────────────────────────────

export interface CreateIntentRequest {
    order_id: string;
    payment_method?: PaymentMethod;
    provider?: SupportedProvider;
    // Amount and currency are RESOLVED SERVER-SIDE from the order.
    // Never accepted from the client.
}

export interface CreateIntentResponse {
    payment_intent_id: string;
    status: PaymentStatus;
    provider: SupportedProvider;
    client_url: string | null;
    client_secret: string | null;
    expires_at: number;
}

// ── Provider Contracts ────────────────────────────────────────────────────────

export interface CreatePaymentResult {
    provider_intent_id: string;
    client_url: string | null;
    client_secret: string | null;
    expires_at: Date;
    // Forwarded back so the orchestrator can log and verify the connect charge.
    connect_account_id?: string | null;
    platform_fee_amount?: number | null;
}

export interface ParsedWebhookEvent {
    provider_event_id: string;          // Unique event ID in the PSP — used for dedup
    provider_intent_id: string;
    raw_status: string;
    normalized_status: PaymentStatus;
    amount: number;
    currency: string;
    metadata: Record<string, string>;
    occurred_at: Date;
}

export interface ProviderStatus {
    raw_status: string;
    normalized_status: PaymentStatus;
    amount: number;
    currency: string;
}

// ── Routing ───────────────────────────────────────────────────────────────────

export interface RoutingContext {
    store_id: string;
    country: string;
    currency: string;
    method: PaymentMethod;
    amount: number;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class OrchestratorError extends Error {
    constructor(
        public readonly code: OrchestratorErrorCode,
        public readonly context?: unknown
    ) {
        super(`OrchestratorError: ${code}`);
        this.name = "OrchestratorError";
    }
}

/**
 * OrchestratorWarning — non-throwing signal for operator-actionable situations.
 *
 * Used when the system can continue but the operator must take manual action.
 * Example: Webpay refund outside processing window.
 *
 * Unlike OrchestratorError, this does NOT abort the operation.
 * The orchestrator catches it, records the state, and returns RefundResult
 * with is_pending_manual = true.
 */
export class OrchestratorWarning extends Error {
    constructor(
        public readonly code: OrchestratorWarningCode,
        public readonly context?: unknown
    ) {
        super(`OrchestratorWarning: ${code}`);
        this.name = "OrchestratorWarning";
    }
}

export type OrchestratorErrorCode =
    | "NO_PROVIDER_AVAILABLE"
    | "INVALID_TRANSITION"
    | "INTENT_ALREADY_PAID"
    | "IDEMPOTENCY_CONFLICT"
    | "PROVIDER_INIT_FAILED"
    | "WEBHOOK_SIGNATURE_INVALID"
    | "INTENT_NOT_FOUND"
    | "REFUND_EXCEEDS_AMOUNT"
    | "REFUND_ALREADY_FULLY_REFUNDED"
    | "REFUND_INVALID_STATUS"        // Intent is not in PAID or PARTIALLY_REFUNDED
    | "REFUND_PROVIDER_FAILED"       // PSP returned hard error
    | "OPTIMISTIC_LOCK_CONFLICT"
    | "STORE_PAYMENTS_DISABLED"      // Store-level kill switch
    | "PROVIDER_CIRCUIT_OPEN"        // PSP is down (Circuit Breaker)
    | "PROVIDER_DISABLED"            // Provider disabled in store config
    | "UNKNOWN_PROVIDER"
    | "READ_ONLY_MODE_ENABLED"      // Final mile: Emergency lockdown
    | "REFUND_EXCEEDS_DAILY_LIMIT"   // Financial guardrail
    | "PAYOUT_EXCEEDS_DAILY_LIMIT"   // Financial guardrail
    | "STORE_NOT_FOUND"             // Store ID does not exist
    | "STORE_SUSPENDED"             // Store is in SUSPENDED or KYC_PENDING state
    | "BANK_ACCOUNT_NOT_VERIFIED"    // Merchant bank details missing or unverified
    | "INSUFFICIENT_BALANCE"        // Ledger balance < payout request
    | "PAYOUT_NOT_FOUND"            // Payout ID does not exist
    | "INVALID_PAYOUT_TRANSITION"   // Illegal move in Payout FSM
    | "PAYOUT_ALREADY_TERMINAL";    // Payout is already SUCCEEDED or FAILED

export type OrchestratorWarningCode =
    | "WEBPAY_REFUND_TIME_EXPIRED";  // Out-of-window — PENDING_MANUAL refund created

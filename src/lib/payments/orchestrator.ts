/**
 * PaymentOrchestrator — The heart of the payment system.
 */
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { adminDb } from "@/lib/firebase/admin-config";
import {
    PaymentIntent,
    CommissionConfig,
    Refund,
    RefundRequest,
    RefundResult,
    LedgerTransaction,
    CreateIntentRequest,
    CreateIntentResponse,
    SupportedProvider,
    OrchestratorError,
    OrchestratorWarning,
    ParsedWebhookEvent,
} from "@/types/payments";
import {
    buildPaymentPaidTransaction,
    buildRefundSucceededTransaction,
} from "./ledger";
import {
    isValidTransition,
    isRefundable,
    assertRefundInvariant,
} from "./fsm";
import {
    buildIntentIdempotencyKey,
    resolveIdempotency,
} from "./idempotency";
import {
    findIntentByIdempotencyKey,
    findIntentByProviderIntentId,
    isEventAlreadyProcessed,
    createIntent as repoCreateIntent,
    transitionStatus,
    appendEvent,
    updateProviderRef,
    saveAttempt,
    findIntentById,
    findRefundByIdempotencyKey,
    saveRefund,
    updateIntentRefundTotals,
    findRefundsByIntentId,
} from "./repository";
import { providerRouter } from "./router";
import { adapterRegistry } from "./registry";
import { circuitBreakerRegistry } from "./circuit-breaker";
import { Metrics } from "./metrics";
import { financialGuard } from "./guard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCommission(amount: number, store: Record<string, any>): CommissionConfig {
    const rate: number = store.platformCommissionRate ?? 0.03;
    const minFee: number = store.platformCommissionMinFee ?? 190;
    const maxFee: number = store.platformCommissionMaxFee ?? 49990;
    const version: string = store.platformCommissionVersion ?? "v1";
    const rawFee = Math.round(amount * rate);
    const fee = Math.min(Math.max(rawFee, minFee), maxFee);
    return { rate, fee, min_fee: minFee, max_fee: maxFee, version };
}

async function resolveOrderData(storeId: string, orderId: string) {
    const [orderSnap, storeSnap] = await Promise.all([
        adminDb.collection("stores").doc(storeId).collection("orders").doc(orderId).get(),
        adminDb.collection("stores").doc(storeId).get(),
    ]);

    if (!orderSnap.exists) {
        throw new OrchestratorError("INTENT_NOT_FOUND", { orderId, storeId });
    }

    const order = orderSnap.data()!;
    const store = storeSnap.data() ?? {};

    // ── Feature Flags ────────────────────────────────────────────────────────
    if (store.compliance_status === "SUSPENDED") {
        throw new OrchestratorError("STORE_SUSPENDED", { storeId, status: store.compliance_status });
    }

    if (store.is_read_only === true) {
        throw new OrchestratorError("READ_ONLY_MODE_ENABLED", { storeId });
    }

    if (store.is_payments_enabled === false) {
        throw new OrchestratorError("STORE_PAYMENTS_DISABLED", { storeId });
    }

    const amount = order.totalAmount as number;
    const currency = order.currency ?? "CLP";
    const country = order.country ?? "CL";
    const connectAccountId = store.stripeConnectAccountId ?? null;
    const commission = connectAccountId ? buildCommission(amount, store) : null;
    const platformFeeAmount = commission?.fee ?? null;

    return {
        amount,
        currency,
        country,
        connectAccountId,
        platformFeeAmount,
        commission,
        config: store.payment_config ?? {} // Return the raw config for fine-grained flags
    };
}

function log(level: "info" | "warn" | "error", event: string, ctx: Record<string, unknown>): void {
    console[level](JSON.stringify({
        ts: new Date().toISOString(),
        service: "payment-orchestrator",
        event,
        ...ctx,
    }));
}

function computeRefundFee(intent: PaymentIntent, refundAmount: number): number {
    if (!intent.commission || intent.amount === 0) return 0;
    return Math.round(intent.commission.fee * (refundAmount / intent.amount));
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export class PaymentOrchestrator {

    async createIntent(storeId: string, request: CreateIntentRequest): Promise<CreateIntentResponse> {
        const startMs = Date.now();
        const { order_id, payment_method = "card" } = request;

        const { amount, currency, country, connectAccountId, platformFeeAmount, commission, config } =
            await resolveOrderData(storeId, order_id);

        // 3. Route to provider (Prioritize manual choice from request)
        const routingProvider = request.provider || providerRouter.route({ store_id: storeId, country, currency, method: payment_method, amount });

        // ── Circuit Breaker & Provider Flag ───────────────────────────────
        if (!circuitBreakerRegistry.isAvailable(routingProvider)) {
            throw new OrchestratorError("PROVIDER_CIRCUIT_OPEN", { provider: routingProvider });
        }
        if (config[`${routingProvider}_enabled`] === false) {
            throw new OrchestratorError("PROVIDER_DISABLED", { provider: routingProvider, storeId });
        }

        const idempotencyKey = buildIntentIdempotencyKey(storeId, order_id, amount, currency);
        const existing = await findIntentByIdempotencyKey(idempotencyKey);
        const resolution = resolveIdempotency(existing);

        if (resolution.action === "reuse") {
            log("info", "intent.reused", { intent_id: resolution.intent.id, order_id });
            return this.intentToResponse(resolution.intent);
        }
        // "create" — proceed (FAILED/CANCELED intents get a fresh one)

        // 4. Persist intent in CREATED status
        const intentId = uuidv4();
        let intent = await repoCreateIntent({
            id: intentId,
            store_id: storeId,
            order_id,
            idempotency_key: idempotencyKey,
            amount,
            currency,
            country,
            payment_method,
            provider: routingProvider,
            provider_intent_id: null,
            status: "CREATED",
            client_url: null,
            client_secret: null,
            expires_at: Date.now() + 30 * 60 * 1000,
            metadata: {},
            // Refund totals — start at zero
            refunded_amount: 0,
            refund_count: 0,
            // ── Stripe Connect (Direct Charge) ────────────────────────────
            connect_account_id: routingProvider === "stripe" ? connectAccountId : null,
            platform_fee_amount: routingProvider === "stripe" ? platformFeeAmount : null,
            // ── Commission snapshot (immutable at charge time) ───────────────
            commission: routingProvider === "stripe" ? commission : null,
        });

        Metrics.intentCreated({ store_id: storeId, intent_id: intentId, provider: routingProvider, amount, currency });

        await appendEvent(intent, "intent.created", null, { amount, currency, provider: routingProvider });

        // 5. Initialize at PSP
        const adapter = adapterRegistry.get(routingProvider);
        const attemptStart = Date.now();

        try {
            const result = await adapter.createPayment(intent);
            circuitBreakerRegistry.onSuccess(routingProvider);

            // 6. Update with PSP reference (not a status transition, no FSM change yet)
            await updateProviderRef(intentId, result.provider_intent_id, result.client_url, result.client_secret);
            intent = await transitionStatus(intent, "PENDING", null, { provider: routingProvider, provider_intent_id: result.provider_intent_id }, "system");

            await saveAttempt({
                payment_intent_id: intentId,
                provider: routingProvider,
                provider_attempt_id: result.provider_intent_id,
                status_raw: "initialized",
                request_payload: { amount, currency, order_id },
                response_payload: { provider_intent_id: result.provider_intent_id },
                http_status: 200,
                error_code: null,
                error_message: null,
                duration_ms: Date.now() - attemptStart,
                created_at: attemptStart,
            });

            Metrics.paymentSuccess({
                store_id: intent.store_id,
                intent_id: intentId,
                provider: routingProvider,
                amount: intent.amount,
                currency: intent.currency,
                duration_ms: Date.now() - attemptStart
            });

            return this.intentToResponse(intent);
        } catch (err) {
            circuitBreakerRegistry.onError(routingProvider);
            Metrics.paymentFailed({
                store_id: storeId,
                intent_id: intentId,
                provider: routingProvider,
                amount,
                currency,
                code: "PROVIDER_INIT_FAILED",
                reason: (err as Error).message
            });
            await transitionStatus(intent, "FAILED", null, { error: (err as Error).message }, "system");
            throw new OrchestratorError("PROVIDER_INIT_FAILED", { provider: routingProvider, cause: err });
        }
    }

    async processWebhook(
        provider: SupportedProvider,
        rawBody: Buffer,
        headers: Record<string, string | string[] | undefined>
    ): Promise<{ status: "processed" | "deduped" | "ignored"; reason?: string }> {
        const adapter = adapterRegistry.get(provider);

        try {
            const parsed = await adapter.parseWebhook(rawBody, headers);

            if (!parsed.provider_intent_id) {
                return { status: "ignored", reason: "non_payment_event" };
            }

            const alreadyProcessed = await isEventAlreadyProcessed(parsed.provider_event_id);
            if (alreadyProcessed) return { status: "deduped" };

            const intent = await findIntentByProviderIntentId(parsed.provider_intent_id);
            if (!intent) {
                log("warn", "webhook.orphan", { provider, provider_intent_id: parsed.provider_intent_id });
                return { status: "ignored", reason: "intent_not_found" };
            }

            if (intent.status === parsed.normalized_status) {
                await appendEvent(intent, "webhook.deduped", parsed.provider_event_id, { raw_status: parsed.raw_status });
                return { status: "deduped" };
            }

            if (!isValidTransition(intent.status, parsed.normalized_status)) {
                await appendEvent(intent, "webhook.ignored_out_of_order", parsed.provider_event_id, {
                    current: intent.status, incoming: parsed.normalized_status
                });
                return { status: "ignored", reason: "invalid_fsm_transition" };
            }

            let ledgerTx: LedgerTransaction | undefined;
            if (parsed.normalized_status === "PAID") {
                ledgerTx = buildPaymentPaidTransaction(intent, parsed.provider_event_id);
            } else if (parsed.normalized_status === "REFUNDED" || parsed.normalized_status === "PARTIALLY_REFUNDED") {
                const refunds = await findRefundsByIntentId(intent.id);
                const refund = refunds.find(r => r.provider_refund_id === parsed.provider_event_id)
                    || refunds.filter(r => r.status === "PENDING").pop();

                if (refund) ledgerTx = buildRefundSucceededTransaction(intent, refund);
            }

            await transitionStatus(intent, parsed.normalized_status, parsed.provider_event_id, {
                raw_status: parsed.raw_status,
                amount: parsed.amount,
                currency: parsed.currency,
            }, "provider", ledgerTx);

            return { status: "processed" };
        } catch (err) {
            log("error", "webhook.error", { provider, error: (err as Error).message });
            return { status: "ignored", reason: (err as Error).message };
        }
    }

    async syncIntentStatus(intentId: string, event: ParsedWebhookEvent, source: "system" | "provider" = "system") {
        const intent = await findIntentById(intentId);
        if (!intent) throw new OrchestratorError("INTENT_NOT_FOUND", { intentId });

        let ledgerTx: LedgerTransaction | undefined;
        if (event.normalized_status === "PAID") {
            ledgerTx = buildPaymentPaidTransaction(intent, event.provider_event_id);
        }

        return transitionStatus(intent, event.normalized_status, event.provider_event_id, {
            raw_status: event.raw_status,
            amount: event.amount,
            currency: event.currency,
        }, source, ledgerTx);
    }

    async refund(intentId: string, request: RefundRequest, operatorUid: string): Promise<RefundResult> {
        const { amount, reason, note } = request;
        const intent = await findIntentById(intentId);
        if (!intent) throw new OrchestratorError("INTENT_NOT_FOUND", { intentId });

        // ── Financial Safeguards ──────────────────────────────────────────
        await financialGuard.checkRefundVelocity(intent.store_id, amount);

        const idempotencyKey = createHash("sha256").update(`${intentId}:${amount}:${reason}:${operatorUid}`).digest("hex");

        const existing = await findRefundByIdempotencyKey(idempotencyKey);
        if (existing) {
            return { refund: existing, new_intent_status: intent.status, is_pending_manual: existing.status === "PENDING_MANUAL" };
        }

        // ── Financial Safeguards ──────────────────────────────────────────
        if (amount > 1000000) {
            log("warn", "refund.high_value_review_required", { intent_id: intentId, amount, operator_id: operatorUid });
            Metrics.highValueRefund({
                store_id: intent.store_id,
                intent_id: intent.id,
                provider: intent.provider,
                amount,
                currency: intent.currency,
                operator_id: operatorUid
            });

            const refund: Refund = {
                id: uuidv4(),
                payment_intent_id: intent.id,
                store_id: intent.store_id,
                idempotency_key: idempotencyKey,
                amount,
                currency: intent.currency,
                reason,
                status: "PENDING_APPROVAL",
                provider: intent.provider,
                provider_refund_id: null,
                refund_fee: computeRefundFee(intent, amount),
                commission_version: intent.commission?.version ?? "none",
                is_full_refund: (intent.refunded_amount + amount) === intent.amount,
                note: note ?? "Held for Dual Control review",
                initiated_by: operatorUid,
                created_at: Date.now(),
                updated_at: Date.now(),
            };
            await saveRefund(refund);
            return { refund, new_intent_status: intent.status, is_pending_manual: false };
        }

        if (!isRefundable(intent.status)) {
            throw new OrchestratorError("REFUND_INVALID_STATUS", { intent_id: intentId, status: intent.status });
        }
        assertRefundInvariant(intent.amount, intent.refunded_amount, amount);

        const refundFee = computeRefundFee(intent, amount);
        const isFullRefund = (intent.refunded_amount + amount) === intent.amount;
        const adapter = adapterRegistry.get(intent.provider);

        let adapterResult;
        try {
            adapterResult = await adapter.refund({
                providerIntentId: intent.provider_intent_id!,
                amount,
                currency: intent.currency,
                reason,
                idempotencyKey,
                isFullRefund,
            });
        } catch (err) {
            if (err instanceof OrchestratorWarning) {
                adapterResult = { provider_refund_id: null, status: "PENDING_MANUAL" as const, is_async: false };
            } else {
                throw err;
            }
        }

        const now = Date.now();
        const refund: Refund = {
            id: uuidv4(),
            payment_intent_id: intent.id,
            store_id: intent.store_id,
            idempotency_key: idempotencyKey,
            amount,
            currency: intent.currency,
            reason,
            status: adapterResult.status,
            provider: intent.provider,
            provider_refund_id: adapterResult.provider_refund_id,
            refund_fee: refundFee,
            commission_version: intent.commission?.version ?? "none",
            is_full_refund: isFullRefund,
            note: note ?? null,
            initiated_by: operatorUid,
            created_at: now,
            updated_at: now,
        };

        if (adapterResult.status === "SUCCEEDED") {
            await this.finalizeRefund(intent, refund);
        } else {
            await saveRefund(refund);
        }

        return {
            refund,
            new_intent_status: adapterResult.status === "SUCCEEDED"
                ? (isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED")
                : intent.status,
            is_pending_manual: adapterResult.status === "PENDING_MANUAL",
        };
    }

    async finalizeRefund(intent: PaymentIntent, refund: Refund): Promise<void> {
        const isFullRefund = intent.refunded_amount + refund.amount >= intent.amount;
        const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";
        const ledgerTx = buildRefundSucceededTransaction(intent, refund);

        await adminDb.runTransaction(async (tx) => {
            await saveRefund({ ...refund, status: "SUCCEEDED", updated_at: Date.now() }, tx);
            await updateIntentRefundTotals(intent, refund.amount, newStatus, {
                refund_id: refund.id,
                reason: refund.reason,
                operator: refund.initiated_by,
                provider_refund_id: refund.provider_refund_id,
            }, tx, ledgerTx);
        });
    }

    private intentToResponse(intent: PaymentIntent): CreateIntentResponse {
        return {
            payment_intent_id: intent.id,
            status: intent.status,
            provider: intent.provider,
            client_url: intent.client_url,
            client_secret: intent.client_secret,
            expires_at: intent.expires_at,
        };
    }
}

export const paymentOrchestrator = new PaymentOrchestrator();

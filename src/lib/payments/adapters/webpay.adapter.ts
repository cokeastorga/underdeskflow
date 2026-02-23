import { webpay } from "@/lib/payments/transbank";
import { PaymentProviderAdapter, RefundParams } from "./base";
import {
    PaymentIntent,
    CreatePaymentResult,
    ParsedWebhookEvent,
    ProviderStatus,
    PaymentStatus,
    RefundStatus,
    RefundAdapterResult,
    StatusResult,
    RefundStatusResult,
    OrchestratorError,
    OrchestratorWarning,
} from "@/types/payments";

/**
 * Webpay (Transbank) refund window: Chile Standard Time (UTC-3).
 * reverseTransaction is only available until 21:00 CLDT on the same calendar day.
 * This check is conservative — if we're within 30 min of the cutoff, we reject
 * to avoid a race between our API call and Transbank's cutoff.
 *
 * Note: Chile observes DST (moves to UTC-4 in summer), but Transbank's cutoff
 * is calendar-day based, not offset-based. We use UTC-3 as a safe constant.
 */
export function isWithinWebpayRefundWindow(now: Date = new Date()): boolean {
    // Convert to Chile time (UTC-3)
    const chileOffset = -3 * 60; // minutes
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const chileMinutes = (utcMinutes + chileOffset + 1440) % 1440; // mod 1440 to stay 0-1439
    const cutoffMinutes = 20 * 60 + 30; // 20:30 CLST (30 min buffer before 21:00 cutoff)
    return chileMinutes < cutoffMinutes;
}


export class WebpayAdapter implements PaymentProviderAdapter {
    readonly providerId = "webpay" as const;

    async createPayment(intent: PaymentIntent): Promise<CreatePaymentResult> {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const returnUrl = `${baseUrl}/api/webhooks/payments/webpay/return?intent_id=${intent.id}`;

        // buyOrder must be ≤ 26 chars alphanumeric — use short prefix + intent suffix
        const buyOrder = `DP-${intent.id.replace(/-/g, "").slice(0, 22)}`;
        const sessionId = intent.id;

        const response = await webpay.create(buyOrder, sessionId, intent.amount, returnUrl);

        return {
            provider_intent_id: response.token,  // Webpay token IS the reference
            client_url: response.url,
            client_secret: null,
            expires_at: new Date(Date.now() + 15 * 60 * 1000), // Webpay: 15 min
        };
    }

    async queryStatus(providerIntentId: string): Promise<StatusResult> {
        const result = await webpay.status(providerIntentId);
        const raw = result.status ?? "failed";
        return {
            status: this.normalizeStatus(raw),
            amount: result.amount ?? 0,
            currency: "CLP",
            raw: result,
        };
    }

    async queryRefundStatus(providerRefundId: string): Promise<RefundStatusResult> {
        // providerRefundId for Webpay is the token (same as intent)
        const result = await webpay.status(providerRefundId);

        // We look for reversals in the history or the current status
        const raw = result.status ?? "failed";

        const statusMap: Record<string, RefundStatus> = {
            "REVERSED": "SUCCEEDED",
            "PARTIALLY_NULLIFIED": "SUCCEEDED",
            "NULLIFIED": "CANCELED",
        };

        return {
            status: statusMap[raw.toUpperCase()] ?? "PENDING",
            amount: result.amount ?? 0,
            currency: "CLP",
            raw: result,
        };
    }

    /**
     * Webpay doesn't send async webhooks — instead the user is redirected
     * back to returnUrl with a token param. This handler processes that redirect.
     * We treat the return as a webhook event for consistency.
     */
    async parseWebhook(
        rawBody: Buffer,
        headers: Record<string, string | string[] | undefined>
    ): Promise<ParsedWebhookEvent> {
        // rawBody contains form-encoded data: token_ws=<token>
        const body = Object.fromEntries(new URLSearchParams(rawBody.toString("utf-8")));
        const token = body["token_ws"] ?? body["TBK_TOKEN"];

        if (!token) {
            throw new OrchestratorError("WEBHOOK_SIGNATURE_INVALID", {
                provider: "webpay",
                reason: "Missing token_ws in Webpay return",
            });
        }

        // Confirm and commit the Webpay transaction
        const result = await webpay.commit(token);
        const raw = result.status ?? "FAILED";

        return {
            provider_event_id: token,
            provider_intent_id: token,  // Token is the PSP reference
            raw_status: raw,
            normalized_status: this.normalizeStatus(raw),
            amount: result.amount ?? 0,
            currency: "CLP",
            metadata: {
                buy_order: result.buy_order ?? "",
                authorization_code: result.authorization_code ?? "",
            },
            occurred_at: new Date(result.transaction_date ?? Date.now()),
        };
    }

    normalizeStatus(rawStatus: string): PaymentStatus {
        const map: Record<string, PaymentStatus> = {
            "AUTHORIZED": "PAID",
            "AUTHORIZED_REVERSED": "REFUNDED",
            "REVERSED": "REFUNDED",
            "FAILED": "FAILED",
            "INITIALIZED": "PENDING",
            "NULLIFIED": "CANCELED",
            "PARTIALLY_NULLIFIED": "REFUNDED",
            "CAPTURED": "PAID",
        };
        return map[rawStatus.toUpperCase()] ?? "FAILED";
    }

    async refund(params: RefundParams): Promise<RefundAdapterResult> {
        const { providerIntentId, amount, isFullRefund } = params;

        // Webpay does NOT support partial refunds.
        // A partial refund must be handled as PENDING_MANUAL.
        if (!isFullRefund) {
            throw new OrchestratorWarning("WEBPAY_REFUND_TIME_EXPIRED", {
                reason: "Webpay does not support partial refunds. Manual bank transfer required.",
                provider: "webpay",
                amount,
            });
        }

        // Check time window. Orchestrator calls this AFTER window check,
        // but we defend in depth here as well.
        if (!isWithinWebpayRefundWindow()) {
            throw new OrchestratorWarning("WEBPAY_REFUND_TIME_EXPIRED", {
                reason: "Webpay reverseTransaction window expired (after 21:00 CLST). Manual transfer required.",
                provider: "webpay",
                amount,
            });
        }

        // Full refund via Webpay reverseTransaction
        const result = await webpay.refund(providerIntentId, amount);

        return {
            provider_refund_id: result.reversal_code ?? result.type ?? null,
            status: "SUCCEEDED",  // Webpay refund is synchronous and immediate
            is_async: false,
        };
    }
}

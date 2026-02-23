import Stripe from "stripe";
import { stripe as stripeClient } from "@/lib/payments/stripe";
import { PaymentProviderAdapter, RefundParams, scrubPci } from "./base";
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
} from "@/types/payments";

export class StripeAdapter implements PaymentProviderAdapter {
    readonly providerId = "stripe" as const;
    private webhookSecret: string;

    constructor() {
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
        if (!this.webhookSecret) {
            console.warn("[StripeAdapter] STRIPE_WEBHOOK_SECRET is not set");
        }
    }

    async createPayment(intent: PaymentIntent): Promise<CreatePaymentResult> {
        // ── Direct Charge model (Stripe Connect) ───────────────────────────────
        // If the store has a Connected account, we use application_fee_amount +
        // transfer_data.destination to route funds at charge time.
        //
        // This is the CORRECT approach (vs. transfers.create() after the fact) because:
        //   1. Refunds and disputes are handled by Stripe automatically — fee is reversed proportionally
        //   2. No race condition between charge and transfer
        //   3. source_transaction is not needed (no post-hoc transfer)
        //   4. Fully compliant with Stripe's preferred Shopify-style integration
        //
        // If no connect_account_id → standard charge (all funds to platform, manual settlement).
        const connectParams = intent.connect_account_id && intent.platform_fee_amount != null
            ? {
                application_fee_amount: intent.platform_fee_amount,
                transfer_data: {
                    destination: intent.connect_account_id,
                },
            }
            : {};

        // CLP is a zero-decimal currency — amount is already in the smallest unit (enteros)
        // See: https://stripe.com/docs/currencies#zero-decimal
        const pi = await stripeClient.paymentIntents.create(
            {
                amount: intent.amount,
                currency: intent.currency.toLowerCase(),
                payment_method_types: ["card"],
                metadata: {
                    internal_intent_id: intent.id,
                    store_id: intent.store_id,
                    order_id: intent.order_id,
                },
                ...connectParams,
            },
            {
                // Forward our idempotency key to Stripe — safe to retry on timeout
                idempotencyKey: `stripe-create-${intent.id}`,
            }
        );

        return {
            provider_intent_id: pi.id,
            client_url: null,
            client_secret: pi.client_secret,
            expires_at: new Date(Date.now() + 30 * 60 * 1000),
            connect_account_id: intent.connect_account_id,
            platform_fee_amount: intent.platform_fee_amount,
        };
    }


    async queryPaymentStatus(providerIntentId: string): Promise<ProviderStatus> {
        const pi = await stripeClient.paymentIntents.retrieve(providerIntentId);
        return {
            raw_status: pi.status,
            normalized_status: this.normalizeStatus(pi.status),
            amount: pi.amount,
            currency: pi.currency.toUpperCase(),
        };
    }

    async parseWebhook(
        rawBody: Buffer,
        headers: Record<string, string | string[] | undefined>
    ): Promise<ParsedWebhookEvent> {
        const sig = headers["stripe-signature"];
        if (!sig || typeof sig !== "string") {
            throw new OrchestratorError("WEBHOOK_SIGNATURE_INVALID", {
                provider: "stripe",
                reason: "Missing stripe-signature header",
            });
        }

        let event: Stripe.Event;
        try {
            event = stripeClient.webhooks.constructEvent(rawBody, sig, this.webhookSecret);
        } catch (err) {
            throw new OrchestratorError("WEBHOOK_SIGNATURE_INVALID", {
                provider: "stripe",
                reason: (err as Error).message,
            });
        }

        // Handle relevant event types
        const PAYMENT_INTENT_EVENTS = new Set([
            "payment_intent.created",
            "payment_intent.processing",
            "payment_intent.requires_action",
            "payment_intent.amount_capturable_updated",
            "payment_intent.succeeded",
            "payment_intent.payment_failed",
            "payment_intent.canceled",
        ]);

        if (!PAYMENT_INTENT_EVENTS.has(event.type)) {
            // Return a neutral non-transitioning event
            return {
                provider_event_id: event.id,
                provider_intent_id: "",
                raw_status: event.type,
                normalized_status: "PENDING",
                amount: 0,
                currency: "USD",
                metadata: {},
                occurred_at: new Date(event.created * 1000),
            };
        }

        const pi = event.data.object as Stripe.PaymentIntent;
        return {
            provider_event_id: event.id,
            provider_intent_id: pi.id,
            raw_status: pi.status,
            normalized_status: this.normalizeStatus(pi.status),
            amount: pi.amount,
            currency: pi.currency.toUpperCase(),
            metadata: (pi.metadata as Record<string, string>) ?? {},
            occurred_at: new Date(event.created * 1000),
        };
    }

    normalizeStatus(rawStatus: string): PaymentStatus {
        const map: Record<string, PaymentStatus> = {
            "requires_payment_method": "PENDING",
            "requires_confirmation": "PENDING",
            "requires_action": "PENDING",
            "processing": "PENDING",
            "requires_capture": "AUTHORIZED",
            "succeeded": "PAID",
            "canceled": "CANCELED",
        };
        return map[rawStatus] ?? "FAILED";
    }

    async refund(params: RefundParams): Promise<RefundAdapterResult> {
        const { providerIntentId, amount, reason, idempotencyKey, isFullRefund } = params;

        // IMPORTANT: Do NOT pass refund_application_fee here.
        // In the Direct Charge model, Stripe automatically reverses application_fee_amount
        // proportionally when a refund is issued. Sending the param would double-reverse.
        // See: https://stripe.com/docs/connect/direct-charges#issuing-refunds
        const refund = await stripeClient.refunds.create(
            {
                payment_intent: providerIntentId,
                // For full refunds, omit amount so Stripe uses the full charge amount
                ...(isFullRefund ? {} : { amount }),
                // Stripe accepts a defined set of reason values
                reason: (reason === "duplicate" || reason === "fraudulent"
                    ? reason
                    : "requested_by_customer") as Stripe.RefundCreateParams["reason"],
                metadata: { internal_reason: reason },
            },
            { idempotencyKey }
        );

        if (refund.status === "failed") {
            throw new OrchestratorError("REFUND_PROVIDER_FAILED", {
                provider: "stripe",
                refund_id: refund.id,
                failure_reason: refund.failure_reason,
            });
        }

        return {
            provider_refund_id: refund.id,
            status: "SUCCEEDED",   // Stripe refunds are synchronous
            is_async: false,
        };
    }

    async queryStatus(providerIntentId: string): Promise<StatusResult> {
        const pi = await stripeClient.paymentIntents.retrieve(providerIntentId);
        return {
            status: this.normalizeStatus(pi.status),
            amount: pi.amount,
            currency: pi.currency.toUpperCase(),
            raw: pi,
        };
    }

    async queryRefundStatus(providerRefundId: string): Promise<RefundStatusResult> {
        const refund = await stripeClient.refunds.retrieve(providerRefundId);

        const statusMap: Record<string, RefundStatus> = {
            "succeeded": "SUCCEEDED",
            "pending": "PENDING",
            "failed": "FAILED",
            "canceled": "CANCELED",
        };

        return {
            status: statusMap[refund.status as string] || "FAILED",
            amount: refund.amount,
            currency: refund.currency.toUpperCase(),
            raw: refund,
        };
    }
}

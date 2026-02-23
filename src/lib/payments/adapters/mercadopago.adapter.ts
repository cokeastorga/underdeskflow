import { createHmac, timingSafeEqual } from "crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
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

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
    options: { timeout: 10_000, idempotencyKey: undefined },
});

export class MercadoPagoAdapter implements PaymentProviderAdapter {
    readonly providerId = "mercadopago" as const;
    private webhookSecret: string;

    constructor() {
        this.webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
    }

    async createPayment(intent: PaymentIntent): Promise<CreatePaymentResult> {
        const preference = new Preference(mpClient);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

        const result = await preference.create({
            body: {
                external_reference: intent.id,  // Internal intent ID — not order_id
                items: [
                    {
                        id: intent.order_id,
                        title: `Order ${intent.order_id}`,
                        quantity: 1,
                        unit_price: intent.amount,
                        currency_id: intent.currency,
                    },
                ],
                back_urls: {
                    success: `${baseUrl}/api/payments/intents/${intent.id}/return?status=success`,
                    failure: `${baseUrl}/api/payments/intents/${intent.id}/return?status=failure`,
                    pending: `${baseUrl}/api/payments/intents/${intent.id}/return?status=pending`,
                },
                auto_return: "approved",
                notification_url: `${baseUrl}/api/webhooks/payments/mercadopago`,
                metadata: {
                    internal_intent_id: intent.id,
                    store_id: intent.store_id,
                },
            },
            requestOptions: { idempotencyKey: `mp-create-${intent.id}` },
        });

        const isProduction = process.env.NODE_ENV === "production";
        const clientUrl = isProduction ? result.init_point : result.sandbox_init_point;

        return {
            provider_intent_id: result.id?.toString() ?? "",
            client_url: clientUrl ?? null,
            client_secret: null,
            expires_at: new Date(Date.now() + 30 * 60 * 1000),
        };
    }

    async queryPaymentStatus(providerIntentId: string): Promise<ProviderStatus> {
        const payments = new Payment(mpClient);
        const payment = await payments.get({ id: providerIntentId });
        const raw = payment.status ?? "rejected";
        return {
            raw_status: raw,
            normalized_status: this.normalizeStatus(raw),
            amount: payment.transaction_amount ?? 0,
            currency: payment.currency_id?.toUpperCase() ?? "ARS",
        };
    }

    async parseWebhook(
        rawBody: Buffer,
        headers: Record<string, string | string[] | undefined>
    ): Promise<ParsedWebhookEvent> {
        // MercadoPago sends x-signature header
        const xSignature = headers["x-signature"];
        const xRequestId = headers["x-request-id"];

        if (this.webhookSecret && xSignature) {
            const sig = typeof xSignature === "string" ? xSignature : xSignature[0];
            const requestId = typeof xRequestId === "string" ? xRequestId : (xRequestId?.[0] ?? "");

            // MP signature format: "ts=...,v1=..."
            const parts = Object.fromEntries(
                sig.split(",").map(p => p.split("=") as [string, string])
            );
            const ts = parts["ts"];
            const v1 = parts["v1"];

            const toSign = `id:${requestId};request-date:${ts};`;
            const expected = createHmac("sha256", this.webhookSecret)
                .update(toSign)
                .digest("hex");

            if (v1 !== expected) {
                throw new OrchestratorError("WEBHOOK_SIGNATURE_INVALID", {
                    provider: "mercadopago",
                });
            }
        }

        const body = JSON.parse(rawBody.toString("utf-8"));

        // MP sends multiple webhook types; we care about payment notifications
        if (body.type !== "payment") {
            return {
                provider_event_id: body.id?.toString() ?? `mp-${Date.now()}`,
                provider_intent_id: "",
                raw_status: body.type,
                normalized_status: "PENDING",
                amount: 0,
                currency: "",
                metadata: {},
                occurred_at: new Date(),
            };
        }

        const paymentId = body.data?.id?.toString();
        if (!paymentId) throw new Error("MercadoPago webhook missing payment id");

        // Fetch the payment to get the authoritative status
        const payments = new Payment(mpClient);
        const payment = await payments.get({ id: paymentId });

        // The internal intent id is stored in external_reference
        const intentId = payment.external_reference ?? "";
        const raw = payment.status ?? "rejected";

        return {
            provider_event_id: `mp-${body.id}`,
            provider_intent_id: paymentId,
            raw_status: raw,
            normalized_status: this.normalizeStatus(raw),
            amount: payment.transaction_amount ?? 0,
            currency: payment.currency_id?.toUpperCase() ?? "ARS",
            metadata: {
                internal_intent_id: intentId,
                mp_payment_id: paymentId,
            },
            occurred_at: new Date(payment.date_created ?? Date.now()),
        };
    }

    normalizeStatus(rawStatus: string): PaymentStatus {
        const map: Record<string, PaymentStatus> = {
            "approved": "PAID",
            "authorized": "AUTHORIZED",
            "in_process": "PENDING",
            "pending": "PENDING",
            "in_mediation": "PENDING",
            "rejected": "FAILED",
            "cancelled": "CANCELED",
            "refunded": "REFUNDED",
            "charged_back": "REFUNDED",
        };
        return map[rawStatus] ?? "FAILED";
    }

    async refund(params: RefundParams): Promise<RefundAdapterResult> {
        const { providerIntentId, amount, isFullRefund, idempotencyKey } = params;

        // MP refund: POST /v1/payments/{id}/refunds
        // The Payment SDK class does not expose a refund() method directly,
        // so we use the REST API with the platform's access token.
        // For full refunds, omit amount — MP refunds the full transaction.
        // Confirmation is ASYNC — the payment.updated webhook is authoritative.
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
        const body = isFullRefund ? {} : { amount };

        const res = await fetch(
            `https://api.mercadopago.com/v1/payments/${providerIntentId}/refunds`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": idempotencyKey,
                },
                body: JSON.stringify(body),
            }
        );

        if (!res.ok) {
            const err = await res.text();
            throw new OrchestratorError("REFUND_PROVIDER_FAILED", {
                provider: "mercadopago",
                status: res.status,
                body: err,
            });
        }

        const data = await res.json() as Record<string, unknown>;

        return {
            provider_refund_id: data.id?.toString() ?? null,
            status: "PENDING",   // Confirmation comes via payment.updated webhook
            is_async: true,
        };
    }

    async queryStatus(providerIntentId: string): Promise<StatusResult> {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${providerIntentId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) {
            throw new OrchestratorError("REFUND_PROVIDER_FAILED", {
                provider: "mercadopago",
                status: res.status,
                context: "queryStatus",
            });
        }

        const data = await res.json() as Record<string, any>;

        const statusMap: Record<string, PaymentStatus> = {
            "approved": "PAID",
            "pending": "PENDING",
            "in_process": "PENDING",
            "rejected": "FAILED",
            "cancelled": "CANCELED",
            "refunded": "REFUNDED",
            "charged_back": "REFUNDED",
        };

        return {
            status: statusMap[data.status as string] || "FAILED",
            amount: data.transaction_amount,
            currency: data.currency_id,
            raw: data,
        };
    }

    async queryRefundStatus(providerRefundId: string): Promise<RefundStatusResult> {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
        const res = await fetch(`https://api.mercadopago.com/v1/payments/refunds/${providerRefundId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) {
            throw new OrchestratorError("REFUND_PROVIDER_FAILED", {
                provider: "mercadopago",
                status: res.status,
                context: "queryRefundStatus",
            });
        }

        const data = await res.json() as Record<string, any>;

        const statusMap: Record<string, RefundStatus> = {
            "approved": "SUCCEEDED",
            "pending": "PENDING",
            "rejected": "FAILED",
            "cancelled": "CANCELED",
        };

        return {
            status: statusMap[data.status as string] || "FAILED",
            amount: data.amount,
            currency: "CLP",
            raw: data,
        };
    }
}

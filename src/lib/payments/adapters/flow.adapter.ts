import { createHmac } from "crypto";
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
} from "@/types/payments";

/**
 * Flow.cl Adapter
 *
 * Flow is a Chilean PSP that works like Webpay but offers more payment methods.
 * This is a production-ready stub — plug in your Flow credentials and
 * call their REST API at https://www.flow.cl/docs/api.html
 *
 * Environment variables needed:
 *   FLOW_API_KEY        — Your Flow API key
 *   FLOW_SECRET_KEY     — Your Flow secret for HMAC signing
 *   FLOW_API_URL        — e.g. https://sandbox.flow.cl/api or https://www.flow.cl/api
 */
export class FlowAdapter implements PaymentProviderAdapter {
    readonly providerId = "flow" as const;
    private apiKey: string;
    private secretKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = process.env.FLOW_API_KEY ?? "";
        this.secretKey = process.env.FLOW_SECRET_KEY ?? "";
        this.apiUrl = process.env.FLOW_API_URL ?? "https://sandbox.flow.cl/api";
    }

    /** Sign a Flow request using HMAC-SHA256 over sorted params. */
    private sign(params: Record<string, string>): string {
        const sorted = Object.keys(params).sort().map(k => `${k}${params[k]}`).join("");
        return createHmac("sha256", this.secretKey).update(sorted).digest("hex");
    }

    private async callFlow(endpoint: string, params: Record<string, string>): Promise<Record<string, unknown>> {
        params.apiKey = this.apiKey;
        params.s = this.sign(params);

        const body = new URLSearchParams(params);
        const res = await fetch(`${this.apiUrl}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
        });

        if (!res.ok) {
            throw new Error(`Flow API error: ${res.status} ${await res.text()}`);
        }
        return res.json();
    }

    async createPayment(intent: PaymentIntent): Promise<CreatePaymentResult> {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const data = await this.callFlow("payment/create", {
            commerceOrder: intent.id,
            subject: `Order ${intent.order_id}`,
            currency: intent.currency,
            amount: intent.amount.toString(),
            email: intent.metadata["customer_email"] ?? "",
            urlConfirmation: `${baseUrl}/api/webhooks/payments/flow`,
            urlReturn: `${baseUrl}/api/webhooks/payments/flow/return?intent_id=${intent.id}`,
            optional: JSON.stringify({ store_id: intent.store_id }),
        });

        return {
            provider_intent_id: (data.flowOrder as number)?.toString() ?? "",
            client_url: (data.url as string) + "?token=" + (data.token as string),
            client_secret: null,
            expires_at: new Date(Date.now() + 30 * 60 * 1000),
        };
    }

    async queryPaymentStatus(flowOrder: string): Promise<ProviderStatus> {
        const data = await this.callFlow("payment/getStatus", { flowOrder });
        const raw = (data.status as number)?.toString() ?? "1";
        return {
            raw_status: raw,
            normalized_status: this.normalizeStatus(raw),
            amount: (data.amount as number) ?? 0,
            currency: "CLP",
        };
    }

    async parseWebhook(
        rawBody: Buffer,
        headers: Record<string, string | string[] | undefined>
    ): Promise<ParsedWebhookEvent> {
        const body = Object.fromEntries(new URLSearchParams(rawBody.toString("utf-8")));
        const { token } = body;

        if (!token) throw new OrchestratorError("WEBHOOK_SIGNATURE_INVALID", { provider: "flow", reason: "Missing token" });

        // Fetch the authoritative status from Flow
        const data = await this.callFlow("payment/getStatus", { token });
        const flowOrder = (data.flowOrder as number)?.toString() ?? "";
        const raw = (data.status as number)?.toString() ?? "1";

        return {
            provider_event_id: token,
            provider_intent_id: flowOrder,
            raw_status: raw,
            normalized_status: this.normalizeStatus(raw),
            amount: (data.amount as number) ?? 0,
            currency: "CLP",
            metadata: {
                commerce_order: (data.commerceOrder as string) ?? "",
                flow_order: flowOrder,
            },
            occurred_at: new Date((data.paymentData as Record<string, unknown>)?.date as string ?? Date.now()),
        };
    }

    /**
     * Flow status codes:
     *   1 = Pending
     *   2 = Paid
     *   3 = Rejected
     *   4 = Canceled
     */
    normalizeStatus(rawStatus: string): PaymentStatus {
        const map: Record<string, PaymentStatus> = {
            "1": "PENDING",
            "2": "PAID",
            "3": "FAILED",
            "4": "CANCELED",
        };
        return map[rawStatus] ?? "FAILED";
    }

    async refund(params: RefundParams): Promise<RefundAdapterResult> {
        const { providerIntentId, amount, idempotencyKey } = params;

        // Flow refund: POST /refund/create
        // Uses the internal idempotency key as refundCommerceOrder to prevent duplicates.
        // Status is ASYNC — poll refund/getStatus via reconciliation job.
        const data = await this.callFlow("refund/create", {
            refundCommerceOrder: idempotencyKey.slice(0, 40),  // Flow: max 40 chars
            receiverEmail: "",  // Optional: populate from order metadata if available
            amount: amount.toString(),
            commerceTrxId: providerIntentId,
        });

        return {
            provider_refund_id: (data.id as number)?.toString() ?? null,
            status: "PENDING",  // Confirmation requires reconciliation polling
            is_async: true,
        };
    }

    async queryStatus(providerIntentId: string): Promise<StatusResult> {
        // Flow: GET /payment/getStatus
        const data = await this.callFlow("payment/getStatus", {
            token: providerIntentId,
        });

        // Flow status: 1: Pendiente, 2: Pagado, 3: Rechazado, 4: Anulado
        const statusMap: Record<number, PaymentStatus> = {
            1: "PENDING",
            2: "PAID",
            3: "FAILED",
            4: "CANCELED",
        };

        const flowStatus = parseInt(data.status as string);

        return {
            status: statusMap[flowStatus] || "FAILED",
            amount: parseFloat(data.amount as string),
            currency: data.currency as string,
            raw: data,
        };
    }

    async queryRefundStatus(providerRefundId: string): Promise<RefundStatusResult> {
        // Flow: GET /refund/getStatus
        const data = await this.callFlow("refund/getStatus", {
            token: providerRefundId,
        });

        // Flow refund status: 1: Pendiente, 2: Pagado, 3: Rechazado, 4: Anulado
        const statusMap: Record<number, RefundStatus> = {
            1: "PENDING",
            2: "SUCCEEDED",
            3: "FAILED",
            4: "CANCELED",
        };

        const flowStatus = parseInt(data.status as string);

        return {
            status: statusMap[flowStatus] || "FAILED",
            amount: parseFloat(data.amount as string),
            currency: "CLP",
            raw: data,
        };
    }
}

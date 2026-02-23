import { SupportedProvider } from "@/types/payments";

/**
 * Technical & Financial Metrics Helper.
 */
interface PaymentMetric {
    store_id: string;
    intent_id: string;
    provider: SupportedProvider;
    amount: number;
    currency: string;
}

class MetricsManager {
    intentCreated(m: PaymentMetric) {
        this.emit("intent.created", m);
    }

    paymentSuccess(m: PaymentMetric & { duration_ms: number }) {
        this.emit("payment.success", m);
    }

    paymentFailed(m: PaymentMetric & { code: string; reason: string }) {
        this.emit("payment.failed", m);
    }

    driftDetected(m: { intent_id: string; psp_status: string; local_status: string; drift_amount: number }) {
        this.emit("drift.detected", m, "error");
    }

    highValueRefund(m: PaymentMetric & { operator_id: string }) {
        this.emit("security.high_value_refund", m, "warn");
    }

    circuitBreakerTrip(provider: SupportedProvider, state: string) {
        this.emit("cb.state_change", { provider, state }, "warn");
    }

    private emit(event: string, payload: any, level: "info" | "warn" | "error" = "info") {
        console[level](JSON.stringify({
            ts: Date.now(),
            service: "payment-metrics",
            metric: event,
            ...payload
        }));
    }
}

export const Metrics = new MetricsManager();

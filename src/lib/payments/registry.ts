import { PaymentProviderAdapter } from "./adapters/base";
import { SupportedProvider, OrchestratorError } from "@/types/payments";
import { StripeAdapter } from "./adapters/stripe.adapter";
import { MercadoPagoAdapter } from "./adapters/mercadopago.adapter";
import { WebpayAdapter } from "./adapters/webpay.adapter";
import { FlowAdapter } from "./adapters/flow.adapter";

/**
 * AdapterRegistry — Single source of truth for all PSP integrations.
 *
 * Adding a new provider:
 *   1. Implement PaymentProviderAdapter
 *   2. registry.register(new YourAdapter())
 *   Done — zero changes to orchestrator or router.
 */
class AdapterRegistry {
    private adapters = new Map<SupportedProvider, PaymentProviderAdapter>();

    register(adapter: PaymentProviderAdapter): this {
        this.adapters.set(adapter.providerId, adapter);
        return this;
    }

    get(providerId: SupportedProvider): PaymentProviderAdapter {
        const adapter = this.adapters.get(providerId);
        if (!adapter) {
            throw new OrchestratorError("UNKNOWN_PROVIDER", { provider: providerId });
        }
        return adapter;
    }

    has(providerId: SupportedProvider): boolean {
        return this.adapters.has(providerId);
    }

    all(): PaymentProviderAdapter[] {
        return [...this.adapters.values()];
    }
}

// ── Singleton registry — initialized once at module load ─────────────────────
export const adapterRegistry = new AdapterRegistry()
    .register(new StripeAdapter())
    .register(new MercadoPagoAdapter())
    .register(new WebpayAdapter())
    .register(new FlowAdapter());

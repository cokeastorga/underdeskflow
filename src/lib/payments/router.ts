import { SupportedProvider, RoutingContext, OrchestratorError, PaymentMethod } from "@/types/payments";
import { circuitBreakerRegistry } from "./circuit-breaker";

interface RoutingRule {
    match: (ctx: RoutingContext) => boolean;
    provider: SupportedProvider;
    description?: string;
}

/**
 * ProviderRouter — Decides which PSP to use for a given payment.
 *
 * Rules are evaluated in order; first match wins.
 * Skips providers whose circuit breaker is OPEN.
 *
 * To add a new routing rule: insert into RULES before the fallback.
 */
const RULES: RoutingRule[] = [
    // Explicit Webpay request for CLP — Transbank is the dominant Chilean PSP
    {
        description: "webpay: explicit CLP webpay request",
        match: (ctx) => ctx.currency === "CLP" && ctx.method === "bank_transfer",
        provider: "webpay",
    },
    // Flow: CLP card or general CL payment
    {
        description: "flow: CLP card in Chile",
        match: (ctx) => ctx.currency === "CLP" && ctx.country === "CL",
        provider: "flow",
    },
    // MercadoPago: LATAM countries except CL for CLP
    {
        description: "mercadopago: LATAM coverage",
        match: (ctx) => ["AR", "MX", "BR", "CO", "PE", "UY", "BO", "PY"].includes(ctx.country),
        provider: "mercadopago",
    },
    // Stripe: global fallback (handles USD/EUR, international cards)
    {
        description: "stripe: global fallback",
        match: () => true,
        provider: "stripe",
    },
];

export class ProviderRouter {
    /**
     * Select the best available provider for the given payment context.
     * Throws OrchestratorError("NO_PROVIDER_AVAILABLE") if all matching
     * providers have open circuit breakers.
     */
    route(ctx: RoutingContext): SupportedProvider {
        const available = circuitBreakerRegistry.getAvailable();

        for (const rule of RULES) {
            if (rule.match(ctx) && available.has(rule.provider)) {
                return rule.provider;
            }
        }

        // All matched providers are OPEN — log circuit states for observability
        const states = circuitBreakerRegistry.getStates();
        console.error("[ProviderRouter] No available provider", { ctx, circuitStates: states });

        throw new OrchestratorError("NO_PROVIDER_AVAILABLE", {
            context: ctx,
            circuitStates: states,
        });
    }

    /** Returns all routing rules (for admin dashboards / observability). */
    getRules(): { provider: SupportedProvider; description: string }[] {
        return RULES.map(r => ({ provider: r.provider, description: r.description ?? "" }));
    }
}

export const providerRouter = new ProviderRouter();

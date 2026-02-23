import { SupportedProvider } from "@/types/payments";

type CBState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CBEntry {
    state: CBState;
    consecutiveErrors: number;
    lastOpenedAt: number | null;
    lastAttemptAt: number | null;
}

const ERROR_THRESHOLD = 5;         // errors before OPEN
const RECOVERY_TIMEOUT_MS = 60_000; // wait before HALF_OPEN
const INITIAL_ENTRY: CBEntry = {
    state: "CLOSED",
    consecutiveErrors: 0,
    lastOpenedAt: null,
    lastAttemptAt: null,
};

/**
 * In-memory Circuit Breaker per provider.
 *
 * States:
 *   CLOSED    → Normal operation. Errors counted.
 *   OPEN      → Provider considered down. All calls fast-fail.
 *   HALF_OPEN → One trial request allowed after recovery timeout.
 *
 * Note: In-memory is intentional for edge/serverless — state resets on cold start.
 * For multi-instance persistence, replace the Map with Redis or Firestore.
 */
class CircuitBreakerRegistry {
    private entries = new Map<SupportedProvider, CBEntry>();

    private get(provider: SupportedProvider): CBEntry {
        if (!this.entries.has(provider)) {
            this.entries.set(provider, { ...INITIAL_ENTRY });
        }
        return this.entries.get(provider)!;
    }

    /**
     * Check if the provider circuit allows a call.
     * Throws if OPEN and recovery timeout not yet elapsed.
     */
    isAvailable(provider: SupportedProvider): boolean {
        const entry = this.get(provider);
        const now = Date.now();

        if (entry.state === "CLOSED") return true;

        if (entry.state === "OPEN") {
            if (entry.lastOpenedAt && (now - entry.lastOpenedAt) >= RECOVERY_TIMEOUT_MS) {
                // Transition to HALF_OPEN — allow one trial request
                entry.state = "HALF_OPEN";
                entry.lastAttemptAt = now;
                this.entries.set(provider, entry);
                return true;
            }
            return false; // Still OPEN
        }

        if (entry.state === "HALF_OPEN") {
            // Only allow a new probe if the last one was not recent
            return true;
        }

        return false;
    }

    /** Call after a successful provider request. */
    onSuccess(provider: SupportedProvider): void {
        const entry = this.get(provider);
        entry.state = "CLOSED";
        entry.consecutiveErrors = 0;
        entry.lastOpenedAt = null;
        this.entries.set(provider, entry);
    }

    /** Call after a provider error. */
    onError(provider: SupportedProvider): void {
        const entry = this.get(provider);
        entry.consecutiveErrors += 1;

        if (entry.state === "HALF_OPEN" || entry.consecutiveErrors >= ERROR_THRESHOLD) {
            entry.state = "OPEN";
            entry.lastOpenedAt = Date.now();
            console.error(`[CircuitBreaker] Provider ${provider} OPENED after ${entry.consecutiveErrors} errors`);
        }

        this.entries.set(provider, entry);
    }

    /** Get all provider states for observability. */
    getStates(): Record<SupportedProvider, CBState> {
        const result = {} as Record<SupportedProvider, CBState>;
        const providers: SupportedProvider[] = ["stripe", "mercadopago", "flow", "webpay"];
        for (const p of providers) {
            result[p] = this.get(p).state;
        }
        return result;
    }

    /** Returns the set of currently available (non-OPEN) providers. */
    getAvailable(): Set<SupportedProvider> {
        const providers: SupportedProvider[] = ["stripe", "mercadopago", "flow", "webpay"];
        return new Set(providers.filter(p => this.isAvailable(p)));
    }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

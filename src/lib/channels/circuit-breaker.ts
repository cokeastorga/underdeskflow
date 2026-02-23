/**
 * Circuit Breaker — Self-healing protective wrapper for external API calls.
 * 
 * States:
 * - CLOSED: Normal operation. Successes reset error count.
 * - OPEN: Failure threshold reached. All calls fail immediately (fail-fast).
 * - HALF_OPEN: Cooldown period expired. Allows trial calls to test recovery.
 */

import { adminDb } from "@/lib/firebase/admin-config";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitStatus {
    id: string; // channelConnectionId
    state: CircuitState;
    failureCount: number;
    lastFailureAt?: number;
    openUntil?: number;
    lastRecoveredAt?: number;
}

export class CircuitBreaker {
    private readonly FAILURE_THRESHOLD = 5;
    private readonly COOLDOWN_PERIOD_MS = 60000; // 1 minute

    /**
     * Get the current status of a circuit from Firestore.
     */
    async getStatus(storeId: string, connectionId: string): Promise<CircuitStatus> {
        const docRef = adminDb
            .collection("stores").doc(storeId)
            .collection("channel_connections").doc(connectionId)
            .collection("circuit_breaker").doc("status");

        const snap = await docRef.get();
        if (!snap.exists) {
            return { id: connectionId, state: "CLOSED", failureCount: 0 };
        }

        const status = snap.data() as CircuitStatus;

        // Auto-transition from OPEN to HALF_OPEN if cooldown expired
        if (status.state === "OPEN" && status.openUntil && Date.now() > status.openUntil) {
            return { ...status, state: "HALF_OPEN" };
        }

        return status;
    }

    /**
     * Check if the circuit is currently allowing calls.
     */
    async isAvailable(storeId: string, connectionId: string): Promise<boolean> {
        const status = await this.getStatus(storeId, connectionId);
        return status.state === "CLOSED" || status.state === "HALF_OPEN";
    }

    /**
     * Record a successful call. Resets failures if in CLOSED/HALF_OPEN.
     */
    async recordSuccess(storeId: string, connectionId: string): Promise<void> {
        const docRef = adminDb
            .collection("stores").doc(storeId)
            .collection("channel_connections").doc(connectionId)
            .collection("circuit_breaker").doc("status");

        await docRef.set({
            state: "CLOSED",
            failureCount: 0,
            lastRecoveredAt: Date.now()
        }, { merge: true });
    }

    /**
     * Record a failed call. May trigger OPEN state.
     */
    async recordFailure(storeId: string, connectionId: string): Promise<void> {
        const docRef = adminDb
            .collection("stores").doc(storeId)
            .collection("channel_connections").doc(connectionId)
            .collection("circuit_breaker").doc("status");

        const status = await this.getStatus(storeId, connectionId);
        const newFailureCount = status.failureCount + 1;

        if (newFailureCount >= this.FAILURE_THRESHOLD) {
            await docRef.set({
                state: "OPEN",
                failureCount: newFailureCount,
                lastFailureAt: Date.now(),
                openUntil: Date.now() + this.COOLDOWN_PERIOD_MS
            }, { merge: true });
        } else {
            await docRef.set({
                failureCount: newFailureCount,
                lastFailureAt: Date.now()
            }, { merge: true });
        }
    }
}

export const circuitBreaker = new CircuitBreaker();

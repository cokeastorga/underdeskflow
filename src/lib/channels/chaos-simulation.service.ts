/**
 * Chaos Simulation Service — Enterprise Resilience Engineering
 * 
 * Allows triggering controlled failures in the sync infrastructure 
 * to verify backoff, circuit breakers, and DLQ handling.
 */

import { adminDb } from "@/lib/firebase/admin-config";

export type ChaosMode = "LATENCY" | "RATE_LIMIT" | "AUTHENTICATION_ERROR" | "INTERNAL_ERROR";

export class ChaosSimulationService {
    /**
     * Injects a chaos rule for a specific store and channel.
     * The SyncOrchestrator or Adapters should check for these rules during execution.
     */
    static async injectChaos(
        storeId: string,
        channelId: string,
        mode: ChaosMode,
        probability: number = 0.5,
        durationMinutes: number = 5
    ): Promise<void> {
        const expiresAt = Date.now() + (durationMinutes * 60 * 1000);

        await adminDb.collection("chaos_simulations").add({
            storeId,
            channelId,
            mode,
            probability,
            expiresAt,
            createdAt: Date.now(),
            active: true
        });

        console.log(`[Chaos] Injected ${mode} for channel ${channelId} (Store: ${storeId})`);
    }

    /**
     * Checks if chaos logic should be applied for the current operation.
     */
    static async getActiveChaos(storeId: string, channelId: string): Promise<ChaosMode | null> {
        const now = Date.now();
        const snap = await adminDb.collection("chaos_simulations")
            .where("storeId", "==", storeId)
            .where("channelId", "==", channelId)
            .where("active", "==", true)
            .where("expiresAt", ">", now)
            .limit(1)
            .get();

        if (snap.empty) return null;

        const data = snap.docs[0].data();
        if (Math.random() < data.probability) {
            return data.mode as ChaosMode;
        }

        return null;
    }

    static async clearChaos(storeId: string): Promise<void> {
        const snap = await adminDb.collection("chaos_simulations")
            .where("storeId", "==", storeId)
            .get();

        const batch = adminDb.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
}

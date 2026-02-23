/**
 * Security Guard Service — Enterprise Compliance & Fraud Prevention
 * 
 * Enforces velocity limits and safety guards for sensitive operations.
 */

import { adminDb } from "@/lib/firebase/admin-config";

export interface SecurityPolicy {
    maxDailyOrders: number;
    maxSingleTransactionAmount: number;
    maxSyncEventsPerMinute: number;
    killSwitchActive: boolean;
}

const DEFAULT_POLICY: SecurityPolicy = {
    maxDailyOrders: 1000,
    maxSingleTransactionAmount: 5000000, // $5M CLP
    maxSyncEventsPerMinute: 200,
    killSwitchActive: false
};

export class SecurityGuardService {
    /**
     * Verifies if a specific store is allowed to perform a sync or financial operation.
     */
    static async checkAccess(storeId: string, operation: "SYNC" | "PAYOUT" | "REFUND"): Promise<{ allowed: boolean; reason?: string }> {
        const storeSnap = await adminDb.collection("stores").doc(storeId).get();
        const config = storeSnap.data()?.securityPolicy as SecurityPolicy ?? DEFAULT_POLICY;

        if (config.killSwitchActive) {
            return { allowed: false, reason: "GLOBAL_KILL_SWITCH_ACTIVE" };
        }

        // Velocity Check (Mocked logic - in production use Redis Counters)
        if (operation === "SYNC") {
            const recentSyncs = await this.getRecentSyncCount(storeId);
            if (recentSyncs > config.maxSyncEventsPerMinute) {
                return { allowed: false, reason: "SYNC_VELOCITY_EXCEEDED" };
            }
        }

        return { allowed: true };
    }

    /**
     * Enforces a hard limit on transaction amounts.
     */
    static validateAmount(amount: number, policy?: SecurityPolicy): boolean {
        const limit = policy?.maxSingleTransactionAmount ?? DEFAULT_POLICY.maxSingleTransactionAmount;
        return amount <= limit;
    }

    private static async getRecentSyncCount(storeId: string): Promise<number> {
        // Implementation would query Redis or a fast-access counter
        return 0; // Stand-in
    }

    /**
     * Activates or deactivates the kill switch for a store.
     */
    static async toggleKillSwitch(storeId: string, active: boolean): Promise<void> {
        await adminDb.collection("stores").doc(storeId).update({
            "securityPolicy.killSwitchActive": active,
            "securityPolicy.updatedAt": Date.now()
        });
    }
}

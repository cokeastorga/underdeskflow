/**
 * Adaptive Polling Service — Enterprise Channel Synchronization
 *
 * Dynamically adjusts the next sync time based on connection activity,
 * order volume, and error rates to optimize API quota usage.
 */

import { ChannelConnection } from "@/types/channels";

export class AdaptivePollingService {
    /**
     * Calculates the next synchronization timestamp (ms) for a connection.
     */
    calculateNextSync(conn: ChannelConnection): number {
        const now = Date.now();
        const baseInterval = (conn.syncConfig.pollingIntervalMinutes || 15) * 60 * 1000;

        // 1. If the connection is currently in ERROR or THROTTLED, 
        // SyncOrchestrator handles backoff; we just push it forward.
        if (conn.status === "ERROR" || conn.status === "THROTTLED") {
            return now + baseInterval * 2; // Slower retry while in error
        }

        // 2. High Traffic Mode:
        // If there were many orders or recent updates, sync more frequently.
        const ordersInLastHour = conn.stats?.totalOrdersSynced ?? 0; // Simplified proxy for recent volume
        const lastActivity = Math.max(
            conn.stats?.lastOrderSync ?? 0,
            conn.stats?.lastStockUpdate ?? 0,
            conn.stats?.lastPriceUpdate ?? 0
        );

        const timeSinceActivity = now - lastActivity;

        // Busy: Order within last 15 min -> 2 min interval
        if (timeSinceActivity < 15 * 60 * 1000) {
            return now + (2 * 60 * 1000);
        }

        // Active: Order within last 2h -> 5 min interval
        if (timeSinceActivity < 120 * 60 * 1000) {
            return now + (5 * 60 * 1000);
        }

        // Idle: No activity in last 12h -> 60 min interval
        if (timeSinceActivity > 12 * 60 * 60 * 1000) {
            return now + (60 * 60 * 1000);
        }

        // Default: use configured base interval
        return now + baseInterval;
    }
}

export const adaptivePolling = new AdaptivePollingService();

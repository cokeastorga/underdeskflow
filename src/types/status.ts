/**
 * Status & Health Types — Phase 5
 * 
 * Used for system observability and channel health monitoring.
 */

import { ChannelType, ChannelConnectionStatus } from "./channels";

export interface ChannelHealthMetric {
    channelId: string;
    channelType: ChannelType;
    displayName?: string;
    status: ChannelConnectionStatus;

    /** Latency of the last successful sync (ms) */
    lastSyncLatencyMs: number;
    /** Percentage of successful syncs in the last 24h */
    successRate24h: number;
    /** Current depth of the sync events queue */
    queueDepth: number;
    /** Number of errors recorded in the last hour */
    errorsLastHour: number;
    /** When the last webhook was received (timestamp ms) */
    lastWebhookAt?: number;
    /** When the last poll was completed (timestamp ms) */
    lastPollAt?: number;
    /** Circuit Breaker state */
    circuitState?: "CLOSED" | "OPEN" | "HALF_OPEN";
}

export interface StoreSystemStatus {
    storeId: string;
    overallStatus: "healthy" | "degraded" | "down";
    channels: ChannelHealthMetric[];
    totalPendingConflicts: number;
    outboxStats: {
        pending: number;
        failed: number;
    };
    securityPolicy?: {
        killSwitchActive: boolean;
        updatedAt: number;
    };
    lastUpdated: number;
}

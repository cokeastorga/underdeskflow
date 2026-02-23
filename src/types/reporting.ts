/**
 * Reporting Types — Phase 4
 *
 * Used by the Reporting Engine, API routes, and frontend UI.
 */

import { ReportingPeriod } from "./payments";

// ─── P&L Report ──────────────────────────────────────────────────────────────

export type PnLGroupBy = "day" | "week" | "month";

export interface PnLRow {
    /** ISO date string: "2026-02-21" (day), "2026-W08" (week), "2026-02" (month) */
    date: string;
    /** Gross revenue (own-store + external if Enterprise) */
    revenue: number;
    /** Platform fee collected (8% of own-store) */
    platformFee: number;
    /** Net payoutable to merchant (revenue − platformFee − channelCommissions) */
    net: number;
    /** Own-store revenue subset */
    ownStoreRevenue: number;
    /** External channel revenue subset (Enterprise) */
    externalRevenue: number;
    /** Channel commissions paid across all channels (trazabilidad) */
    channelCommissions: number;
    /** Number of orders in this period */
    orderCount: number;
}

export interface PnLReport {
    storeId: string;
    period: ReportingPeriod;
    groupBy: PnLGroupBy;
    currency: string;
    rows: PnLRow[];
    totals: PnLRow;
    /** SHA-256 of all ledger tx IDs in the period (for integrity verification) */
    ledgerChecksum: string;
    generatedAt: number;
}

// ─── Channel P&L (Enterprise) ─────────────────────────────────────────────────

export interface ChannelPnLRow {
    channelType: string;         // "own_store" | ChannelType
    label: string;               // Display name
    revenue: number;
    orders: number;
    platformFee: number;         // Always 0 for external channels
    channelCommission: number;   // What the external channel charges
    net: number;                 // revenue − platformFee − channelCommission
    sharePercent: number;        // % of total revenue
}

export interface ChannelPnLReport {
    storeId: string;
    period: ReportingPeriod;
    currency: string;
    rows: ChannelPnLRow[];
    totalRevenue: number;
    generatedAt: number;
}

// ─── Stock Alert Rules ────────────────────────────────────────────────────────

export interface StockAlertRule {
    id: string;
    storeId: string;
    productId: string;
    sku: string;
    productName: string;
    /** Alert fires when current stock ≤ this threshold */
    threshold: number;
    /** @default 'warning'. 'critical' fires when stock ≤ floor */
    criticalFloor?: number;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
}

export type AlertSeverity = "warning" | "critical";

export interface TriggeredAlert {
    rule: StockAlertRule;
    currentStock: number;
    severity: AlertSeverity;
    /** ISO string of when this alert was last checked */
    checkedAt: number;
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

export interface ReconciliationRun {
    id: string;
    storeId: string;
    periodStart: number;  // timestamp ms
    periodEnd: number;    // timestamp ms
    txCount: number;
    /** SHA-256 checksum of all ledger tx IDs + created_at values */
    checksum: string;
    /** Number of discrepancies found (0 = clean reconciliation) */
    discrepancies: number;
    /** Total gross revenue in this period */
    totalRevenue: number;
    /** Total platform fees in this period */
    totalFees: number;
    /** Total net payoutable in this period */
    totalNet: number;
    generatedAt: number;
    status: "clean" | "discrepancy" | "pending";
}

// ─── Dashboard Alerts ─────────────────────────────────────────────────────────

export type DashboardAlertType =
    | "STOCK_LOW"
    | "PAYOUT_DELAYED"
    | "REFUND_RATE_HIGH"
    | "CHANNEL_OFFLINE"
    | "CHANNEL_CONFLICT";

export interface DashboardAlert {
    id: string;
    type: DashboardAlertType;
    severity: AlertSeverity | "info";
    title: string;
    description: string;
    /** Optional URL to navigate to for action */
    actionUrl?: string;
    actionLabel?: string;
    createdAt: number;
}

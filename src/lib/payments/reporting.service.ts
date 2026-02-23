/**
 * Reporting Service — Extended P&L Engine (Phase 4)
 *
 * Builds on top of reporting.ts (basic revenue report) to add:
 *   - Time-series P&L (groupBy day/week/month)
 *   - Per-channel breakdown (Enterprise)
 *   - Reconciliation run generation
 *   - CSV export
 *   - StockAlertRule CRUD
 *   - Stock alert evaluation
 */

import { createHash } from "crypto";
import { adminDb } from "@/lib/firebase/admin-config";
import {
    PnLReport,
    PnLRow,
    PnLGroupBy,
    ChannelPnLReport,
    ChannelPnLRow,
    StockAlertRule,
    TriggeredAlert,
    ReconciliationRun,
} from "@/types/reporting";
import { ReportingPeriod, LedgerTransaction, OrderSource } from "@/types/payments";
import { queryLedgerTransactions } from "./repository";
import { v4 as uuidv4 } from "uuid";

// ─── Collection ────────────────────────────────────────────────────────────────
const STOCK_ALERT_RULES_COL = "stock_alert_rules";
const RECONCILIATION_COL = "reconciliation_runs";

// ─── Date Bucketing ────────────────────────────────────────────────────────────

function getBucket(tsMs: number, groupBy: PnLGroupBy): string {
    const d = new Date(tsMs);
    if (groupBy === "day") {
        return d.toISOString().slice(0, 10); // "2026-02-21"
    }
    if (groupBy === "week") {
        // ISO week number
        const thursday = new Date(d);
        thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
        const yearStart = new Date(thursday.getFullYear(), 0, 1);
        const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
    }
    // month
    return d.toISOString().slice(0, 7); // "2026-02"
}

function zeroPnLRow(date: string): PnLRow {
    return {
        date,
        revenue: 0,
        platformFee: 0,
        net: 0,
        ownStoreRevenue: 0,
        externalRevenue: 0,
        channelCommissions: 0,
        orderCount: 0,
    };
}

// ─── P&L Time-Series ──────────────────────────────────────────────────────────

/**
 * Generates a time-series P&L grouped by day/week/month.
 *
 * Reads `payment_ledger` for financial precision (fee, net),
 * and `payment_intents` for order counts (via queryLedgerTransactions which
 * already returns all txs in the period).
 */
export async function generatePnLReport(
    storeId: string,
    period: ReportingPeriod,
    groupBy: PnLGroupBy = "month",
    currency = "CLP"
): Promise<PnLReport> {
    const txs = await queryLedgerTransactions(storeId, period.start, period.end);

    const bucketMap = new Map<string, PnLRow>();

    for (const tx of txs) {
        const bucket = getBucket(tx.created_at, groupBy);
        if (!bucketMap.has(bucket)) bucketMap.set(bucket, zeroPnLRow(bucket));
        const row = bucketMap.get(bucket)!;

        const isOwn = tx.order_source === "OWN_STORE" || !tx.order_source;
        const isExternal = tx.order_source === "EXTERNAL_CHANNEL";

        for (const entry of tx.entries) {
            const abs = Math.abs(entry.amount);
            if (entry.account === "platform_commissions") {
                row.platformFee += abs;
            } else if (entry.account === "payoutable_balance") {
                row.net += abs;
            } else if (entry.account === "psp_pending") {
                // psp_pending debit = gross revenue
                if (isOwn) row.ownStoreRevenue += abs;
                if (isExternal) row.externalRevenue += abs;
                row.revenue += abs;
                if (tx.type === "PAYMENT_PAID") row.orderCount += 1;
            } else if (entry.account === "channel_commission") {
                row.channelCommissions += abs;
            }
        }
    }

    // Sort buckets chronologically
    const rows = [...bucketMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, row]) => row);

    // Totals row
    const totals = rows.reduce(
        (acc, row) => ({
            date: "total",
            revenue: acc.revenue + row.revenue,
            platformFee: acc.platformFee + row.platformFee,
            net: acc.net + row.net,
            ownStoreRevenue: acc.ownStoreRevenue + row.ownStoreRevenue,
            externalRevenue: acc.externalRevenue + row.externalRevenue,
            channelCommissions: acc.channelCommissions + row.channelCommissions,
            orderCount: acc.orderCount + row.orderCount,
        }),
        zeroPnLRow("total")
    );

    // Integrity checksum
    const checksumBase = txs
        .sort((a, b) => a.created_at - b.created_at)
        .map(tx => `${tx.id}:${tx.created_at}`)
        .join("|");
    const ledgerChecksum = createHash("sha256").update(checksumBase || "empty").digest("hex");

    return { storeId, period, groupBy, currency, rows, totals, ledgerChecksum, generatedAt: Date.now() };
}

// ─── Channel P&L (Enterprise) ─────────────────────────────────────────────────

export async function generateChannelPnLReport(
    storeId: string,
    period: ReportingPeriod,
    currency = "CLP"
): Promise<ChannelPnLReport> {
    const txs = await queryLedgerTransactions(storeId, period.start, period.end);

    // Aggregate by order_source (own_store + each channel type)
    const channelMap = new Map<string, Omit<ChannelPnLRow, "sharePercent">>();

    const ensure = (key: string, label: string) => {
        if (!channelMap.has(key)) {
            channelMap.set(key, {
                channelType: key, label,
                revenue: 0, orders: 0,
                platformFee: 0, channelCommission: 0, net: 0,
            });
        }
        return channelMap.get(key)!;
    };

    for (const tx of txs) {
        const channelKey = tx.order_source === "EXTERNAL_CHANNEL"
            ? (tx.channel_type ?? "external_unknown")
            : "own_store";
        const label = channelKey === "own_store" ? "Tienda propia" : channelKey;
        const row = ensure(channelKey, label);

        for (const entry of tx.entries) {
            const abs = Math.abs(entry.amount);
            if (entry.account === "psp_pending") {
                row.revenue += abs;
                if (tx.type === "PAYMENT_PAID") row.orders += 1;
            } else if (entry.account === "platform_commissions") {
                row.platformFee += abs;
            } else if (entry.account === "channel_commission") {
                row.channelCommission += abs;
            }
        }
        // net = revenue - platformFee - channelCommission
        row.net = row.revenue - row.platformFee - row.channelCommission;
    }

    const totalRevenue = [...channelMap.values()].reduce((s, r) => s + r.revenue, 0);

    const rows: ChannelPnLRow[] = [...channelMap.values()].map(r => ({
        ...r,
        sharePercent: totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0,
    }));

    // Own-store first, sort the rest by revenue desc
    rows.sort((a, b) => {
        if (a.channelType === "own_store") return -1;
        if (b.channelType === "own_store") return 1;
        return b.revenue - a.revenue;
    });

    return { storeId, period, currency, rows, totalRevenue, generatedAt: Date.now() };
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

export async function generateReconciliationRun(
    storeId: string,
    period: ReportingPeriod
): Promise<ReconciliationRun> {
    const txs = await queryLedgerTransactions(storeId, period.start, period.end);

    let totalRevenue = 0, totalFees = 0, totalNet = 0;
    let discrepancies = 0;

    for (const tx of txs) {
        let debitSum = 0, creditSum = 0;
        for (const entry of tx.entries) {
            if (entry.type === "DEBIT") debitSum += entry.amount;
            else creditSum += Math.abs(entry.amount);

            const abs = Math.abs(entry.amount);
            if (entry.account === "psp_pending") totalRevenue += abs;
            if (entry.account === "platform_commissions") totalFees += abs;
            if (entry.account === "payoutable_balance") totalNet += abs;
        }
        // Check double-entry balance (debits = credits within tolerance)
        if (Math.abs(debitSum - creditSum) > 0.01) discrepancies += 1;
    }

    const checksumBase = txs
        .sort((a, b) => a.created_at - b.created_at)
        .map(tx => `${tx.id}:${tx.created_at}`)
        .join("|");
    const checksum = createHash("sha256").update(checksumBase || "empty").digest("hex");

    const run: ReconciliationRun = {
        id: uuidv4(),
        storeId,
        periodStart: period.start,
        periodEnd: period.end,
        txCount: txs.length,
        checksum,
        discrepancies,
        totalRevenue,
        totalFees,
        totalNet,
        generatedAt: Date.now(),
        status: discrepancies === 0 ? "clean" : "discrepancy",
    };

    // Persist run for history
    await adminDb.collection(RECONCILIATION_COL).doc(run.id).set(run);
    return run;
}

export async function getReconciliationHistory(
    storeId: string,
    limitN = 20
): Promise<ReconciliationRun[]> {
    const snap = await adminDb
        .collection(RECONCILIATION_COL)
        .where("storeId", "==", storeId)
        .orderBy("generatedAt", "desc")
        .limit(limitN)
        .get();
    return snap.docs.map(d => d.data() as ReconciliationRun);
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportPnLReportAsCSV(report: PnLReport): string {
    const header = "fecha,ingresos_brutos,tienda_propia,canales_externos,fee_plataforma,comisiones_canales,ingreso_neto,num_ordenes";
    const rows = report.rows.map(r =>
        [r.date, r.revenue, r.ownStoreRevenue, r.externalRevenue,
        r.platformFee, r.channelCommissions, r.net, r.orderCount].join(",")
    );
    const totals = report.totals;
    const totRow = ["TOTAL", totals.revenue, totals.ownStoreRevenue, totals.externalRevenue,
        totals.platformFee, totals.channelCommissions, totals.net, totals.orderCount].join(",");
    return [header, ...rows, totRow].join("\r\n");
}

export function exportChannelPnLReportAsCSV(report: ChannelPnLReport): string {
    const header = "canal,ingresos,ordenes,fee_plataforma,comision_canal,neto,participacion_%";
    const rows = report.rows.map(r =>
        [r.label, r.revenue, r.orders, r.platformFee, r.channelCommission, r.net, r.sharePercent.toFixed(2)].join(",")
    );
    const totalRevenue = report.totalRevenue;
    const totRow = ["TOTAL", totalRevenue, report.rows.reduce((s, r) => s + r.orders, 0),
        report.rows.reduce((s, r) => s + r.platformFee, 0),
        report.rows.reduce((s, r) => s + r.channelCommission, 0),
        report.rows.reduce((s, r) => s + r.net, 0), "100.00"].join(",");
    return [header, ...rows, totRow].join("\r\n");
}

// ─── Stock Alert Rules ────────────────────────────────────────────────────────

export async function getStockAlertRules(storeId: string): Promise<StockAlertRule[]> {
    const snap = await adminDb
        .collection(STOCK_ALERT_RULES_COL)
        .where("storeId", "==", storeId)
        .where("enabled", "==", true)
        .orderBy("createdAt", "asc")
        .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StockAlertRule));
}

export async function upsertStockAlertRule(
    storeId: string,
    rule: Omit<StockAlertRule, "id" | "storeId" | "createdAt" | "updatedAt">
): Promise<StockAlertRule> {
    const now = Date.now();

    // Check if a rule for this product already exists
    const existing = await adminDb
        .collection(STOCK_ALERT_RULES_COL)
        .where("storeId", "==", storeId)
        .where("productId", "==", rule.productId)
        .limit(1)
        .get();

    if (!existing.empty) {
        const doc = existing.docs[0];
        await doc.ref.update({ ...rule, updatedAt: now });
        return { id: doc.id, storeId, createdAt: doc.data().createdAt, ...rule, updatedAt: now };
    }

    const id = uuidv4();
    const full: StockAlertRule = { id, storeId, createdAt: now, updatedAt: now, ...rule };
    await adminDb.collection(STOCK_ALERT_RULES_COL).doc(id).set(full);
    return full;
}

export async function deleteStockAlertRule(storeId: string, ruleId: string): Promise<void> {
    const doc = await adminDb.collection(STOCK_ALERT_RULES_COL).doc(ruleId).get();
    if (!doc.exists || doc.data()?.storeId !== storeId) return; // ownership check
    await doc.ref.delete();
}

/**
 * Evaluate all stock alert rules for a store.
 * Reads current stock from `stores/{storeId}/products/{productId}` or the products collection.
 */
export async function checkStockAlerts(storeId: string): Promise<TriggeredAlert[]> {
    const rules = await getStockAlertRules(storeId);
    if (rules.length === 0) return [];

    const triggered: TriggeredAlert[] = [];
    const now = Date.now();

    await Promise.all(
        rules.map(async (rule) => {
            // Fetch current stock from products collection
            const productSnap = await adminDb
                .collection("stores").doc(storeId)
                .collection("products").doc(rule.productId)
                .get();

            if (!productSnap.exists) return;

            const stock: number = productSnap.data()?.stock ?? productSnap.data()?.inventory ?? 0;

            if (stock <= rule.threshold) {
                const severity = rule.criticalFloor !== undefined && stock <= rule.criticalFloor
                    ? "critical"
                    : "warning";
                triggered.push({ rule, currentStock: stock, severity, checkedAt: now });
            }
        })
    );

    return triggered;
}

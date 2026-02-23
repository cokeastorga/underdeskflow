/**
 * Reconciliation Service — Enterprise Financial Hardening
 * 
 * Verifies that every order on a channel has a corresponding 
 * Ledger entry and that the amounts (revenue, commission) match.
 */

import { adminDb } from "@/lib/firebase/admin-config";
import { getAdapter } from "./adapter.registry";
import { ChannelConnection, ChannelType } from "@/types/channels";
import { NormalizedOrder } from "./adapters/channel-adapter.interface";

export interface ReconciliationResult {
    connectionId: string;
    channelType: ChannelType;
    periodStart: number;
    periodEnd: number;
    totalOrdersInChannel: number;
    totalOrdersInLedger: number;
    discrepancies: {
        type: "MISSING_ORDER" | "AMOUNT_MISMATCH" | "GHOST_TRANSACTION";
        externalId: string;
        details: string;
        severity: "HIGH" | "MEDIUM" | "LOW";
    }[];
    totalRevenueDrift: number;
    totalCommissionDrift: number;
    timestamp: number;
}

export class ReconciliationService {
    /**
     * Reconciles a channel connection for a specific time period.
     */
    static async reconcile(
        storeId: string,
        connection: ChannelConnection,
        days: number = 30
    ): Promise<ReconciliationResult> {
        const periodEnd = Date.now();
        const periodStart = periodEnd - (days * 24 * 60 * 60 * 1000);

        const adapter = getAdapter(connection.channelType);

        // 1. Fetch orders from the External Channel
        const channelOrders = await adapter.fetchOrdersSince(connection.credentials, periodStart);

        // 2. Fetch ledger transactions for this channel in this period
        const ledgerSnap = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("ledger_transactions")
            .where("metadata.channelType", "==", connection.channelType)
            .where("created_at", ">=", periodStart)
            .where("created_at", "<=", periodEnd)
            .get();

        const ledgerOrders = new Map<string, any>();
        ledgerSnap.docs.forEach(doc => {
            const data = doc.data();
            // In SyncOrchestrator, docId for external orders is ext_{channel}_{extId}
            // But reference_id in ledger stores this docId.
            const extId = data.reference_id.split("_").slice(2).join("_");
            ledgerOrders.set(extId, data);
        });

        const discrepancies: ReconciliationResult["discrepancies"] = [];
        let revenueDrift = 0;
        let commissionDrift = 0;

        // 3. Cross-reference
        for (const cOrder of channelOrders) {
            const lOrder = ledgerOrders.get(cOrder.externalId);

            if (!lOrder) {
                discrepancies.push({
                    type: "MISSING_ORDER",
                    externalId: cOrder.externalId,
                    details: `Pedido de ${connection.channelType} no encontrado en el Ledger.`,
                    severity: "HIGH"
                });
                revenueDrift += cOrder.totalAmount;
                continue;
            }

            // Compare amounts
            const ledgerRevenue = lOrder.metadata.totalAmount ?? lOrder.entries.find((e: any) => e.account === "external_channel_revenue")?.amount ?? 0;
            const ledgerComm = lOrder.metadata.channelCommission ?? Math.abs(lOrder.entries.find((e: any) => e.account === "external_channel_commission_expense")?.amount ?? 0);

            if (Math.abs(ledgerRevenue - cOrder.totalAmount) > 1) { // 1 unit tolerance for rounding
                discrepancies.push({
                    type: "AMOUNT_MISMATCH",
                    externalId: cOrder.externalId,
                    details: `Diferencia de monto: Canal=$${cOrder.totalAmount} vs Ledger=$${ledgerRevenue}`,
                    severity: "MEDIUM"
                });
                revenueDrift += (cOrder.totalAmount - ledgerRevenue);
            }

            if (Math.abs(ledgerComm - cOrder.channelCommission) > 5) { // Higher tolerance for commission as it varies
                commissionDrift += (cOrder.channelCommission - ledgerComm);
            }
        }

        return {
            connectionId: connection.id,
            channelType: connection.channelType,
            periodStart,
            periodEnd,
            totalOrdersInChannel: channelOrders.length,
            totalOrdersInLedger: ledgerOrders.size,
            discrepancies,
            totalRevenueDrift: revenueDrift,
            totalCommissionDrift: commissionDrift,
            timestamp: Date.now()
        };
    }
}

/**
 * Channel Status API — GET /api/channels/status
 * 
 * Aggregates health metrics for all active channel connections.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import { adminDb } from "@/lib/firebase/admin-config";
import { ChannelConnection, SyncEvent } from "@/types/channels";
import { StoreSystemStatus, ChannelHealthMetric } from "@/types/status";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const storeId = searchParams.get("storeId");

    if (!storeId) {
        return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    try {
        // 1. Fetch all connections
        const connectionsSnap = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("channel_connections")
            .get();

        const connections = connectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChannelConnection));

        const channelMetrics: ChannelHealthMetric[] = [];
        let totalConflicts = 0;

        for (const conn of connections) {
            // 2. Count pending events in outbox
            const pendingEventsSnap = await adminDb
                .collection("stores")
                .doc(storeId)
                .collection("channel_connections")
                .doc(conn.id)
                .collection("sync_events")
                .where("status", "==", "PENDING")
                .get();

            // 3. Count errors in the last hour
            const oneHourAgo = Date.now() - 60 * 60 * 1000;
            const recentErrorsSnap = await adminDb
                .collection("stores")
                .doc(storeId)
                .collection("channel_connections")
                .doc(conn.id)
                .collection("sync_events")
                .where("status", "==", "FAILED")
                .where("createdAt", ">=", oneHourAgo)
                .get();

            // 4. Calculate approximate success rate (last 50 events)
            const last50Snap = await adminDb
                .collection("stores")
                .doc(storeId)
                .collection("channel_connections")
                .doc(conn.id)
                .collection("sync_events")
                .orderBy("createdAt", "desc")
                .limit(50)
                .get();

            const last50 = last50Snap.docs.map(d => d.data() as SyncEvent);
            const successCount = last50.filter(e => e.status === "SENT").length;
            const successRate = last50.length > 0 ? (successCount / last50.length) * 100 : 100;

            // Fetch circuit breaker status
            const circuitSnap = await adminDb
                .collection("stores").doc(storeId)
                .collection("channel_connections").doc(conn.id)
                .collection("circuit_breaker").doc("status")
                .get();
            const circuit = circuitSnap.exists ? circuitSnap.data() : { state: "CLOSED" };

            channelMetrics.push({
                channelId: conn.id,
                channelType: conn.channelType,
                displayName: conn.displayName,
                status: (circuit as any).state === "OPEN" ? "ERROR" : conn.status,
                lastSyncLatencyMs: conn.stats?.errorsLast24h || 0, // Placeholder
                successRate24h: successRate,
                queueDepth: pendingEventsSnap.size,
                errorsLastHour: recentErrorsSnap.size,
                lastWebhookAt: conn.lastSyncAt,
                lastPollAt: conn.lastSyncAt,
                circuitState: (circuit as any).state || "CLOSED"
            });

            totalConflicts += conn.stats?.pendingConflicts || 0;
        }

        // 5. Fetch conflicts from the central log to be sure
        const conflictsSnap = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("product_change_events")
            .where("resolved", "==", false)
            .get();

        totalConflicts = conflictsSnap.size;

        // 6. Fetch Outbox counts
        const outboxPendingSnap = await adminDb.collection("stores").doc(storeId)
            .collection("outbox_events").where("status", "==", "PENDING").get();
        const outboxFailedSnap = await adminDb.collection("stores").doc(storeId)
            .collection("outbox_events").where("status", "==", "FAILED").get();

        // 7. Fetch Security Policy
        const storeSnap = await adminDb.collection("stores").doc(storeId).get();
        const securityPolicy = storeSnap.data()?.securityPolicy || { killSwitchActive: false, updatedAt: 0 };

        const systemStatus: StoreSystemStatus = {
            storeId,
            overallStatus: channelMetrics.some(m => m.status === "ERROR" || m.status === "THROTTLED") ? "degraded" : "healthy",
            channels: channelMetrics,
            totalPendingConflicts: totalConflicts,
            outboxStats: {
                pending: outboxPendingSnap.size,
                failed: outboxFailedSnap.size
            },
            securityPolicy,
            lastUpdated: Date.now(),
        };

        return NextResponse.json(systemStatus);
    } catch (error: any) {
        console.error("Error fetching system status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import { ReconciliationService } from "@/lib/channels/reconciliation.service";
import { listChannelConnections } from "@/lib/channels/channel.repository";

/**
 * POST /api/channels/[connectionId]/reconcile?storeId=...
 * 
 * Manually triggers a reconciliation report for a channel connection.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ connectionId: string }> }
): Promise<NextResponse> {
    const { connectionId } = await params;
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
        const connections = await listChannelConnections(storeId);
        const connection = connections.find(c => c.id === connectionId);

        if (!connection) {
            return NextResponse.json({ error: "Connection not found" }, { status: 404 });
        }

        const report = await ReconciliationService.reconcile(storeId, connection);

        // Save report to audit log (optional: product_change_events or a new collection)
        await adminDb.collection("stores").doc(storeId).collection("reconciliation_reports").add({
            ...report,
            createdBy: user.uid,
            createdAt: Date.now()
        });

        return NextResponse.json(report);
    } catch (error: any) {
        console.error("Reconciliation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

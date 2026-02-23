/**
 * Resolve Conflict API — POST /api/products/resolve-conflict
 * 
 * Handles manual resolution of data discrepancies between platform and channels.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import { adminDb } from "@/lib/firebase/admin-config";
import { syncOrchestrator } from "@/lib/channels/sync.orchestrator";
import { ProductChangeEvent } from "@/types/channels";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { storeId, eventId, strategy } = await req.json();

        if (!storeId || !eventId || !strategy) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (strategy !== "PLATFORM_WINS" && strategy !== "CHANNEL_WINS") {
            return NextResponse.json({ error: "Invalid resolution strategy" }, { status: 400 });
        }

        // 1. Fetch the event
        const eventDoc = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("product_change_events")
            .doc(eventId)
            .get();

        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const event = { id: eventDoc.id, ...eventDoc.data() } as ProductChangeEvent;
        if (event.resolved) {
            return NextResponse.json({ error: "Conflict already resolved" }, { status: 400 });
        }

        // 2. Apply resolution
        if (strategy === "PLATFORM_WINS") {
            // Platform wins: Push current platform value back to the channel
            // We need the connectionId. Usually we have one connection per channelType.
            const connSnap = await adminDb
                .collection("stores")
                .doc(storeId)
                .collection("channel_connections")
                .where("channelType", "==", event.channelType)
                .limit(1)
                .get();

            if (connSnap.empty) {
                return NextResponse.json({ error: "Channel connection not found" }, { status: 404 });
            }

            const connId = connSnap.docs[0].id;

            if (event.field === "price" || event.field === "stock") {
                await syncOrchestrator.enqueueWriteback({
                    storeId,
                    channelConnectionId: connId,
                    productId: event.productId,
                    externalProductId: event.externalProductId!,
                    field: event.field,
                    newValue: Number(event.previousValue), // PreviousValue is what the platform has
                });
            }
        } else {
            // Channel wins: Update platform's product record with channel's value
            const productRef = adminDb.collection("products").doc(event.productId);
            const productDoc = await productRef.get();

            if (productDoc.exists) {
                const numericFields = ["price", "stock"];
                const val = numericFields.includes(event.field)
                    ? Number(event.newValue)
                    : event.newValue;

                await productRef.update({
                    [event.field]: val,
                    updatedAt: Date.now()
                });
            }
        }

        // 3. Mark as resolved
        await eventDoc.ref.update({
            resolved: true,
            resolvedAt: Date.now(),
            resolvedBy: user.uid,
            resolutionStrategy: strategy
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error resolving conflict:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

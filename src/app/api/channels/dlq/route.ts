/**
 * DLQ Management API — GET /api/channels/dlq
 * 
 * Returns failed outbox events for technical maintenance.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import { adminDb } from "@/lib/firebase/admin-config";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
        return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    try {
        // Fetch failed outbox events
        const failedEventsSnap = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("outbox_events")
            .where("status", "==", "FAILED")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const failedEvents = failedEventsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ failedEvents });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DLQ Retry API — POST /api/channels/dlq/retry
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { storeId, eventId } = await req.json();

        if (!storeId || !eventId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const docRef = adminDb
            .collection("stores")
            .doc(storeId)
            .collection("outbox_events")
            .doc(eventId);

        const snap = await docRef.get();
        if (!snap.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Reset status and attempts to allow the worker to pick it up again
        await docRef.update({
            status: "PENDING",
            attempts: 0,
            scheduledFor: Date.now(),
            lastError: null
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { SystemEvent } from "@/lib/services/event-bus";

const MAX_RETRIES = 3;

/**
 * Global Event Bus Worker Endpoint
 * Triggered by Google Cloud Tasks (or Cron) to process decoupled background events.
 * 
 * POST /api/internal/workers/event-bus
 */
export async function POST(req: Request) {
    try {
        // Authenticate the request (e.g. check OIDC token from Cloud Tasks)
        const authHeader = req.headers.get("authorization");
        if (process.env.NODE_ENV === "production" && !authHeader?.includes("Bearer")) {
            return NextResponse.json({ error: "Unauthorized worker invocation" }, { status: 401 });
        }

        const body = await req.json();
        const { storeId, eventId } = body;

        if (!storeId || !eventId) {
            return NextResponse.json({ error: "Missing storeId or eventId" }, { status: 400 });
        }

        const eventRef = adminDb.collection("stores").doc(storeId).collection("event_bus").doc(eventId);
        const eventSnap = await eventRef.get();

        if (!eventSnap.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const event = eventSnap.data() as SystemEvent;

        if (event.status === "completed") {
            return NextResponse.json({ message: "Event already completed" });
        }

        if (event.retries >= MAX_RETRIES) {
            return NextResponse.json({ error: "Max retries exceeded" }, { status: 422 });
        }

        // --- Process the Event based on Topic ---
        await eventRef.update({ status: "processing" });

        try {
            switch (event.topic) {
                case "order.created":
                    console.log(`[Worker] Handling order.created for ${event.payload.orderId}`);
                    // e.g. send email confirmation, notify Kitchen printer
                    break;
                case "payment.succeeded":
                    console.log(`[Worker] Handling payment.succeeded for ${event.payload.paymentId}`);
                    break;
                default:
                    console.log(`[Worker] Unhandled topic: ${event.topic}`);
            }

            // Mark completed
            await eventRef.update({
                status: "completed",
                processedAt: Date.now()
            });

            return NextResponse.json({ success: true, eventId: event.id });

        } catch (processingError: any) {
            // Handle specific failures
            console.error(`[Worker] Error processing event ${eventId}:`, processingError);
            await eventRef.update({
                status: "failed",
                error: processingError.message || "Unknown error",
                retries: event.retries + 1
            });
            return NextResponse.json({ error: "Processing failed", details: processingError.message }, { status: 500 });
        }

    } catch (error) {
        console.error("[Worker] Fatal execution error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

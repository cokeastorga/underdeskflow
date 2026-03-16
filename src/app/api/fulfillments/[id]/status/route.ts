import { NextRequest, NextResponse } from "next/server";
import { advanceFulfillment } from "@/domains/fulfillment/services.server";
import { FulfillmentStatus } from "@/domains/fulfillment/types";

/**
 * PATCH /api/fulfillments/[id]/status
 * Advances the fulfillment FSM to the requested status.
 * The FSM guard rejects invalid transitions automatically.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { status, assignedDriverId, trackingCode, trackingUrl } = await req.json();

        if (!status) {
            return NextResponse.json({ error: "status required" }, { status: 400 });
        }

        await advanceFulfillment(params.id, status as FulfillmentStatus, {
            ...(assignedDriverId && { assignedDriverId }),
            ...(trackingCode && { trackingCode }),
            ...(trackingUrl && { trackingUrl }),
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        // FSM will throw on invalid transitions — bubble that up clearly to the client
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

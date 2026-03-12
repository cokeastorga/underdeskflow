import { NextRequest, NextResponse } from "next/server";
import { handleOrderPaid } from "@/workers/events/order-paid";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    let payloadStr = "";
    let requestId = "unknown";

    try {
        const authHeader = req.headers.get("Authorization");
        // In PROD: Validate authHeader against process.env.WORKER_SECRET
        
        const body = await req.json();
        const { event, payload, timestamp } = body;
        requestId = body.requestId || crypto.randomUUID();
        
        payloadStr = JSON.stringify(payload);

        if (!event || !payload) {
             logger.warn("Invalid Event Payload sent to Worker API", { requestId, body });
             return NextResponse.json({ error: "Invalid Event Payload" }, { status: 400 });
        }

        logger.info(`Event consumed: ${event}`, {
            requestId,
            event,
            storeId: payload.storeId
        });

        switch(event) {
            case "order.paid":
                await handleOrderPaid(payload, requestId);
                break;
            case "inventory.movement_created":
                // await syncChannelInventory(payload);
                break;
            case "payment.succeeded":
                // We might trigger receipts here
                break;
            default:
                logger.warn(`Unhandled event type: ${event}`, { requestId, event });
        }

        return NextResponse.json({ success: true, processed: true });
    } catch (err: any) {
        logger.error(`Error processing event internally`, { 
            requestId,
            error: err,
            payloadConfig: payloadStr
        });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

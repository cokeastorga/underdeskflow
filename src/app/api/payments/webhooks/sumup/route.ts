import { NextRequest, NextResponse } from "next/server";
import { handlePaymentIntentWebhookUpdate } from "@/domains/payments/services.server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();
    let payload;

    try {
        payload = await req.json();
        
        logger.info("SumUp webhook received", {
            requestId,
            provider: "sumup",
            status: payload.status,
            paymentId: payload.id
        });

        const intentId = payload.intentId || payload.id; 
        
        if (payload.status === "SUCCESSFUL" || payload.status === "PAID") {
             await handlePaymentIntentWebhookUpdate(intentId, "SUCCEEDED", payload.transaction_id);
             logger.info("SumUp webhook processed (SUCCEEDED)", { requestId, intentId });
        } else if (payload.status === "FAILED") {
             await handlePaymentIntentWebhookUpdate(intentId, "FAILED", payload.transaction_id);
             logger.info("SumUp webhook processed (FAILED)", { requestId, intentId });
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        logger.error("SumUp webhook failed", {
            requestId,
            error: err,
            payload
        });
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }
}

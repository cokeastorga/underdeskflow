import { NextRequest, NextResponse } from "next/server";
import { handlePaymentIntentWebhookUpdate } from "@/domains/payments/services.server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();
    let payload;

    try {
        payload = await req.json();
        
        logger.info("MercadoPago webhook received", {
            requestId,
            provider: "mercadopago",
            paymentId: payload?.data?.id,
            action: payload?.action || payload?.type
        });

        if (payload.action === "payment.created" || payload.type === "payment") {
             const intentId = payload.data?.external_reference || "UNKNOWN";
             const status = payload.data?.status === "approved" ? "SUCCEEDED" : "FAILED";
             
             await handlePaymentIntentWebhookUpdate(intentId, status, payload.data?.id);
             
             logger.info("MercadoPago webhook processed successfully", {
                 requestId,
                 intentId,
                 status
             });
        }
        
        return NextResponse.json({ received: true });
    } catch (err: any) {
         logger.error("MercadoPago webhook failed", {
             requestId,
             error: err,
             payload
         });
         return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }
}

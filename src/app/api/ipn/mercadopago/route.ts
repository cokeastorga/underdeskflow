import { NextRequest, NextResponse } from "next/server";
import { processMercadoPagoNotification } from "@/lib/payments/notification.processor.server";

/**
 * IPN (Instant Payment Notification) Mirror.
 * Provides redundancy for the standard Webhook.
 * Handles both POST (default) and GET (legacy/fallback) notifications.
 */
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const headers = Object.fromEntries(req.headers.entries());
        
        await processMercadoPagoNotification(rawBody, headers);

        // Always return 200/201 to MP
        return new NextResponse("OK", { status: 200 });

    } catch (err: any) {
        console.error("[MP IPN] POST Failure:", err.message);
        return new NextResponse("Error", { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const topic = searchParams.get("topic");
        const id = searchParams.get("id");

        if (topic && id) {
            const mockBody = JSON.stringify({
                resource: `https://api.mercadolibre.com/v1/payments/${id}`,
                topic: topic,
                id: id
            });
            
            const headers = Object.fromEntries(req.headers.entries());
            await processMercadoPagoNotification(mockBody, headers);
        }

        return new NextResponse("OK", { status: 200 });
    } catch (err: any) {
        console.error("[MP IPN] GET Failure:", err.message);
        return new NextResponse("Error", { status: 500 });
    }
}

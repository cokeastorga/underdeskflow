import { NextRequest, NextResponse } from "next/server";
import { processMercadoPagoNotification } from "@/lib/payments/notification.processor.server";

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const headers = Object.fromEntries(req.headers.entries());
        
        const result = await processMercadoPagoNotification(rawBody, headers);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ 
            received: true, 
            status: result.definitiveStatus || "processed",
            idempotency_hit: result.idempotency_hit 
        });

    } catch (err: any) {
        console.error("[MP Webhook] Critical Failure:", err.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

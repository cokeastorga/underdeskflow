import { NextRequest, NextResponse } from "next/server";
import { createPaymentIntent } from "@/domains/payments/services.server";

export async function POST(req: NextRequest) {
    try {
        const {
            storeId,
            orderId,
            amount,
            provider,
            deviceId,
            idempotencyKey
        } = await req.json();

        if (!storeId || !orderId || !amount || !provider || !idempotencyKey) {
            return NextResponse.json({ error: "Missing highly required intent fields" }, { status: 400 });
        }

        const intent = await createPaymentIntent(
            storeId,
            orderId,
            amount,
            provider,
            idempotencyKey,
            deviceId
        );

        return NextResponse.json({ intent }, { status: (intent.createdAt === intent.updatedAt) ? 201 : 200 });
    } catch (error: any) {
         console.error("Intent Creation Error:", error);
         return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

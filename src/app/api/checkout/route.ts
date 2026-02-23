
import { NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripe";
import { mpPreference } from "@/lib/payments/mercadopago";
import { webpay } from "@/lib/payments/transbank";
import { Product } from "@/types";


interface CheckoutBody {
    items: (Product & { quantity: number })[];
    orderId: string;
    provider: "stripe" | "mercadopago" | "webpay";
    storeId: string;
}

export async function POST(req: Request) {
    return NextResponse.json({
        error: "ENDPOINT_DEPRECATED",
        message: "This checkout endpoint is deprecated. Please use the Payment Intents API at /api/payments/intents instead.",
        migration_guide: "Model B (Integrated Payments) is now mandatory for all stores."
    }, { status: 410 }); // 410 Gone
}

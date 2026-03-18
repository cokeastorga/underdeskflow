import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

interface Params {
    params: Promise<{ id: string }>;
}

/**
 * Handle Mercado Pago return (redirect back to site).
 * This endpoint NEVER performs business logic (stock/plans).
 * It only resolves the redirection to the appropriate UI module.
 */
export async function GET(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status"); // success, failure, pending

    try {
        const intentDoc = await adminDb.collection("payment_intents").doc(id).get();
        if (!intentDoc.exists) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        const intentData = intentDoc.data();
        const isSubscription = intentData?.metadata?.type === "subscription";
        
        // Base URL for redirection
        const baseUrl = new URL(req.url).origin;
        let targetPath = "/";

        if (isSubscription) {
            targetPath = "/tenant/billing";
        } else if (intentData?.orderId) {
            targetPath = `/tenant/orders/${intentData.orderId}`;
        }

        const redirectUrl = new URL(targetPath, baseUrl);
        if (status) {
            redirectUrl.searchParams.set("mp_status", status);
            redirectUrl.searchParams.set("pi_id", id);
        }

        return NextResponse.redirect(redirectUrl.toString());

    } catch (err) {
        console.error("[MP Return] Redirection failed:", err);
        return NextResponse.redirect(new URL("/", req.url));
    }
}

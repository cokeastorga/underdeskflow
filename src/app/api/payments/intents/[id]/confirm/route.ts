import { NextRequest, NextResponse } from "next/server";
import { paymentOrchestrator } from "@/lib/payments/orchestrator";
import { OrchestratorError } from "@/types/payments";

/**
 * POST /api/payments/intents/[id]/confirm
 *
 * Called after a redirect-based payment flow (Mercado Pago Bricks, Webpay, Flow)
 * returns control to our frontend. The frontend sends the PSP's confirmation token
 * so we can verify the charge server-side and advance the intent FSM.
 *
 * Body: { token?: string; payment_id?: string; status?: string }
 *
 * Next.js 15+: params is a Promise — must be awaited before use.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: intentId } = await params;

    try {
        const body = await request.json().catch(() => ({}));

        const result = await paymentOrchestrator.confirmPayment(intentId, {
            token:      body.token,
            payment_id: body.payment_id,
            status:     body.status,
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("[ConfirmAPI] Error:", err);

        if (err instanceof OrchestratorError) {
            const statusMap: Record<string, number> = {
                INTENT_NOT_FOUND:       404,
                INTENT_ALREADY_SETTLED: 409,
                CONFIRM_PROVIDER_FAILED: 502,
            };
            return NextResponse.json(
                { code: err.code, context: err.context },
                { status: statusMap[err.code] ?? 500 }
            );
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * GET /api/payments/intents/[id]/confirm
 *
 * Allows polling from the success page — returns the current intent status
 * so the UI can determine if it should show "approved", "pending", or redirect
 * to failure without re-triggering a charge.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: intentId } = await params;

    try {
        const { findIntentById } = await import("@/lib/payments/repository");
        const intent = await findIntentById(intentId);

        if (!intent) {
            return NextResponse.json({ error: "Intent not found" }, { status: 404 });
        }

        // Return only safe fields — never expose client_secret
        return NextResponse.json({
            id:         intent.id,
            status:     intent.status,
            order_id:   intent.order_id,
            provider:   intent.provider,
            amount:     intent.amount,
            currency:   intent.currency,
            updated_at: intent.updated_at,
        });
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

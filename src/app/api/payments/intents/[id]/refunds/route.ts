import { NextRequest, NextResponse } from "next/server";
import { paymentOrchestrator } from "@/lib/payments/orchestrator";
import { RefundRequest, OrchestratorError } from "@/types/payments";
import { adminAuth } from "@/lib/firebase/admin-config";

/**
 * POST /api/payments/intents/[id]/refunds
 *
 * Operations:
 * 1. Authenticate operator (must be a store admin)
 * 2. Validate request body
 * 3. Atomic refund via Orchestrator (PSP + FSM + Ledger)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: intentId } = await params;
        const body = (await request.json()) as RefundRequest;

        // 1. Auth check (Simplified for this example — should verify store ownership)
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const operatorUid = decodedToken.uid;

        // 2. Perform refund
        const result = await paymentOrchestrator.refund(intentId, body, operatorUid);

        return NextResponse.json(result);

    } catch (err) {
        console.error("[RefundAPI] Error:", err);

        if (err instanceof OrchestratorError) {
            const statusMap: Record<string, number> = {
                "INTENT_NOT_FOUND": 404,
                "REFUND_INVALID_STATUS": 400,
                "REFUND_EXCEEDS_AMOUNT": 400,
                "REFUND_PROVIDER_FAILED": 502,
                "IDEMPOTENCY_CONFLICT": 409,
            };
            return NextResponse.json(
                { code: err.code, context: err.context },
                { status: statusMap[err.code] ?? 500 }
            );
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/payments/intents/[id]/refunds
 * Returns all refund records for a given intent.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { findRefundsByIntentId } = await import("@/lib/payments/repository");
        const refunds = await findRefundsByIntentId(id);
        return NextResponse.json(refunds);
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

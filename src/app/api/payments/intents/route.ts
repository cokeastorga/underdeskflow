/**
 * POST /api/payments/intents
 *
 * Creates a new payment intent for an order.
 * The client sends ONLY: { order_id, payment_method? }
 * Amount and currency are ALWAYS resolved server-side from the Order document.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin-config";
import { paymentOrchestrator } from "@/lib/payments/orchestrator";
import { CreateIntentRequest, OrchestratorError } from "@/types/payments";
import { z } from "zod";

const BODY_LIMIT = 1024; // 1KB — we expect only order_id + method

const RequestSchema = z.object({
    order_id: z.string().min(1).max(128),
    payment_method: z.enum(["card", "bank_transfer", "wallet", "cash"]).optional(),
    provider: z.enum(["stripe", "mercadopago", "flow", "webpay"]).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
    // ── Auth ────────────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let uid: string;
    try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        uid = decoded.uid;
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Body guards ─────────────────────────────────────────────────────────
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > BODY_LIMIT) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        return NextResponse.json({ error: "Unsupported Media Type" }, { status: 415 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
    }

    // ── Resolve store from UID ───────────────────────────────────────────────
    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const storeId: string = userSnap.data()?.storeId;
    if (!storeId) return NextResponse.json({ error: "No store associated" }, { status: 403 });

    // ── Orchestrate ──────────────────────────────────────────────────────────
    try {
        const result = await paymentOrchestrator.createIntent(storeId, parsed.data as CreateIntentRequest);
        return NextResponse.json(result, { status: 201 });
    } catch (err) {
        if (err instanceof OrchestratorError) {
            const statusMap: Record<string, number> = {
                INTENT_ALREADY_PAID: 409,
                NO_PROVIDER_AVAILABLE: 503,
                PROVIDER_INIT_FAILED: 502,
                INTENT_NOT_FOUND: 404,
            };
            return NextResponse.json(
                { error: err.code, details: err.context },
                { status: statusMap[err.code] ?? 500 }
            );
        }
        console.error("[POST /payments/intents] unexpected error", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

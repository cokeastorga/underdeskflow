/**
 * GET /api/payments/intents/[id]
 *
 * Returns sanitized intent status for the authenticated store owner.
 * Never exposes client_secret or internal version fields.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin-config";
import { findIntentById } from "@/lib/payments/repository";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params): Promise<NextResponse> {
    const { id } = await params;

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

    // ── Resolve store ───────────────────────────────────────────────────────
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const storeId: string = userSnap.data()?.storeId ?? "";

    // ── Find intent ──────────────────────────────────────────────────────────
    const intent = await findIntentById(id);
    if (!intent) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ── Ownership check ─────────────────────────────────────────────────────
    if (intent.store_id !== storeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Return sanitized snapshot ────────────────────────────────────────────
    return NextResponse.json({
        id: intent.id,
        order_id: intent.order_id,
        status: intent.status,
        provider: intent.provider,
        amount: intent.amount,
        currency: intent.currency,
        client_url: intent.client_url,
        // client_secret intentionally omitted in GET — only returned at creation time
        expires_at: intent.expires_at,
        created_at: intent.created_at,
        updated_at: intent.updated_at,
    });
}

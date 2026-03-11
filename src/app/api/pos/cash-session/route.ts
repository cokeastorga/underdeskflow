import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

/**
 * Cash Session Management API
 *
 * POST   — Open a new session. If another open session exists, returns conflict info for force-takeover.
 * PATCH  — Update session (add withdrawal / close session).
 * GET    — Get active session for a store.
 */

export async function POST(req: NextRequest) {
    try {
        const { storeId, openingAmount, openedBy, forceTakeover } = await req.json();

        if (!storeId || openingAmount === undefined || !openedBy) {
            return NextResponse.json({ error: "storeId, openingAmount, openedBy required" }, { status: 400 });
        }

        const sessionsRef = adminDb.collection("stores").doc(storeId).collection("cash_sessions");

        // Check for existing open session
        const openSnap = await sessionsRef.where("status", "==", "open").limit(1).get();

        if (!openSnap.empty && !forceTakeover) {
            const existing = openSnap.docs[0];
            return NextResponse.json({
                conflict: true,
                existingSession: { id: existing.id, ...existing.data() },
            });
        }

        // If force takeover, mark the previous session as taken_over
        if (!openSnap.empty && forceTakeover) {
            await openSnap.docs[0].ref.update({
                status: "taken_over",
                takenOverBy: openedBy,
                takenOverAt: Timestamp.now(),
            });
        }

        // Create new session
        const now = Timestamp.now();
        const sessionRef = sessionsRef.doc();
        await sessionRef.set({
            id: sessionRef.id,
            storeId,
            openedBy,
            openingAmount,
            openedAt: now,
            status: "open",
            totalSales: 0,
            saleCount: 0,
            totalWithdrawals: 0,
            withdrawals: [],
            closingAmount: null,
            difference: null,
            closedAt: null,
            closedBy: null,
            updatedAt: now,
        });

        return NextResponse.json({ sessionId: sessionRef.id }, { status: 201 });
    } catch (err: any) {
        console.error("[Cash Session POST]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { storeId, sessionId, action, ...payload } = await req.json();
        // action: "withdrawal" | "close"

        if (!storeId || !sessionId || !action) {
            return NextResponse.json({ error: "storeId, sessionId, action required" }, { status: 400 });
        }

        const sessionRef = adminDb
            .collection("stores")
            .doc(storeId)
            .collection("cash_sessions")
            .doc(sessionId);

        const snap = await sessionRef.get();
        if (!snap.exists) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const now = Timestamp.now();

        if (action === "withdrawal") {
            const { amount, note, by } = payload;
            await sessionRef.update({
                totalWithdrawals: FieldValue.increment(amount),
                withdrawals: FieldValue.arrayUnion({ amount, note, by, at: now }),
                updatedAt: now,
            });
            return NextResponse.json({ success: true });
        }

        if (action === "close") {
            const { closingAmount, closedBy } = payload;
            const data = snap.data()!;
            const expectedCash =
                (data.openingAmount ?? 0) +
                (data.totalSales ?? 0) -
                (data.totalWithdrawals ?? 0);
            const difference = closingAmount - expectedCash;

            await sessionRef.update({
                status: "closed",
                closingAmount,
                difference,
                closedAt: now,
                closedBy,
                updatedAt: now,
            });
            return NextResponse.json({ success: true, difference });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (err: any) {
        console.error("[Cash Session PATCH]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");

        if (!storeId) {
            return NextResponse.json({ error: "storeId required" }, { status: 400 });
        }

        const snap = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("cash_sessions")
            .where("status", "==", "open")
            .limit(1)
            .get();

        if (snap.empty) {
            return NextResponse.json({ session: null });
        }

        const doc = snap.docs[0];
        return NextResponse.json({ session: { id: doc.id, ...doc.data() } });
    } catch (err: any) {
        console.error("[Cash Session GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

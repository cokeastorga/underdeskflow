import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { appendFinancialEvent } from "@/domains/pos/events";

/**
 * Cash Session Management API (Global / Multi-Branch)
 */

export async function POST(req: NextRequest) {
    try {
        const { storeId, branchId, registerId, openingAmount, openedBy, forceTakeover, deviceId = "unknown-device", openedByUserId } = await req.json();

        if (!storeId || !branchId || !registerId || openingAmount === undefined || !openedBy || !openedByUserId) {
            return NextResponse.json({ error: "storeId, branchId, registerId, openingAmount, openedBy, openedByUserId required" }, { status: 400 });
        }

        const sessionsRef = adminDb.collection("cash_sessions");

        // Strict Uniqueness check: closedAt must be null on a specific register
        const openSnap = await sessionsRef
            .where("storeId", "==", storeId)
            // Note: Register uniqueness automatically isolates it to the branch
            .where("registerId", "==", registerId)
            .where("closedAt", "==", null)
            .limit(1)
            .get();

        if (!openSnap.empty && !forceTakeover) {
            const existing = openSnap.docs[0];
            return NextResponse.json({
                conflict: true,
                existingSession: { id: existing.id, ...existing.data() },
            });
        }

        if (!openSnap.empty && forceTakeover) {
            await openSnap.docs[0].ref.update({
                status: "taken_over",
                closedAt: Timestamp.now(), // Close properly so subsequent unique queries work
                takenOverBy: openedBy,
                takenOverAt: Timestamp.now(),
            });
        }

        const now = Timestamp.now();
        const sessionRef = sessionsRef.doc();
        await sessionRef.set({
            id: sessionRef.id,
            storeId,
            branchId,
            registerId,
            deviceId,
            openedBy,
            openedByUserId,
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

        await appendFinancialEvent({
            storeId,
            branchId,
            registerId,
            sessionId: sessionRef.id,
            type: "SESSION_OPENED",
            amount: openingAmount,
            notes: "Session Opened",
            userId: openedByUserId,
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

        if (!sessionId || !action) {
            return NextResponse.json({ error: "sessionId, action required" }, { status: 400 });
        }

        const sessionRef = adminDb.collection("cash_sessions").doc(sessionId);
        const snap = await sessionRef.get();
        if (!snap.exists) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const data = snap.data()!;
        const now = Timestamp.now();

        if (action === "withdrawal") {
            const { amount, note, by } = payload;
            await sessionRef.update({
                totalWithdrawals: FieldValue.increment(amount),
                withdrawals: FieldValue.arrayUnion({ amount, note, by, at: now }),
                updatedAt: now,
            });

            await appendFinancialEvent({
                storeId,
                branchId: data.branchId,
                registerId: data.registerId,
                sessionId,
                type: "WITHDRAWAL",
                amount: -Math.abs(amount), // Negative to indicate output
                notes: note || "Manual Withdrawal",
                userId: by, // Assuming 'by' is the user ID or name submitted
            });

            return NextResponse.json({ success: true });
        }

        if (action === "close") {
            const { closingAmount, closedBy } = payload;
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

            await appendFinancialEvent({
                storeId,
                branchId: data.branchId,
                registerId: data.registerId,
                sessionId,
                type: "SESSION_CLOSED",
                amount: closingAmount,
                notes: `Session Closed. Expected: ${expectedCash}, Diff: ${difference}`,
                userId: closedBy,
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
        const branchId = searchParams.get("branchId");
        const registerId = searchParams.get("registerId");

        if (!storeId || !branchId || !registerId) {
            return NextResponse.json({ error: "storeId, branchId, and registerId required" }, { status: 400 });
        }

        const snap = await adminDb
            .collection("cash_sessions")
            .where("storeId", "==", storeId)
            .where("registerId", "==", registerId)
            .where("closedAt", "==", null)
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

/**
 * Conflicts API — GET /api/products/conflicts
 * 
 * Returns unresolved product change events that require manual review.
 * 
 * Auth: Firebase ID token
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import { adminDb } from "@/lib/firebase/admin-config";
import { ProductChangeEvent } from "@/types/channels";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const storeId = searchParams.get("storeId");

    if (!storeId) {
        return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    try {
        const snap = await adminDb
            .collection("stores")
            .doc(storeId)
            .collection("product_change_events")
            .where("resolved", "==", false)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const conflicts = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ProductChangeEvent[];

        return NextResponse.json({ conflicts });
    } catch (error: any) {
        console.error("Error fetching conflicts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

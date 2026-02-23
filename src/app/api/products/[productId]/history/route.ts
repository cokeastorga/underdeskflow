import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { verifyAuth } from "@/lib/firebase/admin-auth";
import { ProductChangeEvent } from "@/types/channels";

/**
 * GET /api/products/[productId]/history?storeId=...
 *
 * Fetches the audit log of all changes (ProductChangeEvent) for a specific product.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
    const { productId } = await params;
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
            .where("productId", "==", productId)
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();

        const history = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ProductChangeEvent[];

        return NextResponse.json({ history });
    } catch (error: any) {
        console.error("Error fetching product history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

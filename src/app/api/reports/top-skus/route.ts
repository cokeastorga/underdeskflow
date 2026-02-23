import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { verifyAuth } from "@/lib/firebase/admin-auth";

/**
 * GET /api/reports/top-skus?storeId=...&channel=...&limit=10
 * 
 * Aggregates sales data from the Ledger (or Orders) to find top performing items.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyAuth(token).catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const storeId = searchParams.get("storeId");
    const channelType = searchParams.get("channel");
    const limit = Number(searchParams.get("limit") || "10");

    if (!storeId) {
        return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    try {
        let query: any = adminDb
            .collection("stores")
            .doc(storeId)
            .collection("orders");

        if (channelType && channelType !== "all") {
            query = query.where("channelType", "==", channelType);
        }

        const snap = await query.orderBy("placedAt", "desc").limit(500).get();

        const skus: Record<string, { sku: string; title: string; quantity: number; revenue: number; channel: string }> = {};

        snap.docs.forEach((doc: any) => {
            const order = doc.data();
            order.lines?.forEach((line: any) => {
                const key = `${line.sku || line.externalProductId}_${order.channelType}`;
                if (!skus[key]) {
                    skus[key] = {
                        sku: line.sku || "N/A",
                        title: line.title,
                        quantity: 0,
                        revenue: 0,
                        channel: order.channelType
                    };
                }
                skus[key].quantity += line.quantity;
                skus[key].revenue += line.totalPrice;
            });
        });

        const result = Object.values(skus)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);

        return NextResponse.json({ topSkus: result });
    } catch (error: any) {
        console.error("Top SKUs Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

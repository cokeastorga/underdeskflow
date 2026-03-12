import { NextResponse, NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

export const runtime = 'nodejs'; // Because we use firebase-admin. To go full Edge, one must use REST API for Firebase or Vercel KV. We use Next.js fetch caching in middleware instead.

/**
 * GET /api/edge/domain-lookup
 * Internal endpoint called by Middleware to map a custom domain (e.g. "delicias.cl") to a storeId.
 * Next.js 'fetch' inside middleware handles the actual Edge caching (stale-while-revalidate).
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const hostname = searchParams.get('hostname');

    if (!hostname) {
        return NextResponse.json({ error: "Missing hostname" }, { status: 400 });
    }

    try {
        const domainDoc = await adminDb.collection("domains").doc(hostname.toLowerCase()).get();

        if (!domainDoc.exists) {
             return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        const data = domainDoc.data()!;
        if (!data.verified) {
            // Depending on business rules, we could still resolve or block unverified domains
            return NextResponse.json({ error: "Domain not verified" }, { status: 403 });
        }

        return NextResponse.json({ storeId: data.storeId });
    } catch (err: any) {
        console.error("Domain Edge Lookup error:", err);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

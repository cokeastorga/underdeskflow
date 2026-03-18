import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/server-utils";
import { adminDb } from "@/lib/firebase/admin-config";

export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== "platform_admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { storeId } = await req.json();
        if (!storeId) {
            return NextResponse.json({ error: "storeId is required" }, { status: 400 });
        }

        // Verify store exists
        const storeDoc = await adminDb.doc(`stores/${storeId}`).get();
        if (!storeDoc.exists) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const response = NextResponse.json({ success: true });
        
        // Set impersonation cookie (expires in 2 hours)
        response.cookies.set("udf_impersonate", storeId, {
            path: "/",
            httpOnly: false, // Need to read it on client-side AuthContext
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 2, // 2 hours
        });

        return response;
    } catch (e) {
        console.error("Impersonation error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const response = NextResponse.json({ success: true });
    response.cookies.delete("udf_impersonate");
    return response;
}

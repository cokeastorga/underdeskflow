import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin-config";

export async function POST() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (sessionCookie) {
        try {
            const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
            await adminAuth.revokeRefreshTokens(decodedClaims.uid);
        } catch (error) {
            console.error("Error revoking refresh tokens:", error);
        }
    }

    cookieStore.delete("__session");
    return NextResponse.json({ status: "success" });
}

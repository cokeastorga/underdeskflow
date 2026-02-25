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
        } catch (error: any) {
            // If the user record was already deleted, revokeRefreshTokens will fail.
            // We can safely ignore this error as we are clearing the session cookie anyway.
            if (error.code !== "auth/user-not-found") {
                console.error("Error revoking refresh tokens:", error);
            }
        }
    }

    cookieStore.delete("__session");
    return NextResponse.json({ status: "success" });
}

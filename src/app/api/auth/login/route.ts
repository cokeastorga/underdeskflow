import { adminAuth } from "@/lib/firebase/admin-config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BODY_LIMIT_BYTES = 4 * 1024; // 4 KB

export async function POST(request: NextRequest) {
    // 1. Content-Type guard
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        return NextResponse.json({ error: "Unsupported Media Type" }, { status: 415 });
    }

    // 2. Body size guard (prevent body-bomb DoS)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > BODY_LIMIT_BYTES) {
        return NextResponse.json({ error: "Payload Too Large" }, { status: 413 });
    }

    // 3. CSRF origin check (production only)
    if (process.env.NODE_ENV === "production") {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const origin = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
        if (appUrl && !origin.startsWith(appUrl)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    let body: { idToken?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
        return NextResponse.json({ error: "Missing or invalid ID token" }, { status: 400 });
    }

    // Additional sanity: Firebase ID tokens are JWTs and shouldn't be > 2KB
    if (idToken.length > 2048) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in ms

    try {
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        const cookieStore = await cookies();
        cookieStore.set("__session", sessionCookie, {
            maxAge: expiresIn / 1000, // maxAge is in seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "strict",
        });
        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("Error creating session cookie:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

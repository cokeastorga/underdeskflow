import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin-config";
import { sendVerificationEmail } from "@/lib/notifications/email";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. Verify user exists in Firebase to avoid sending spam to unknown addresses
        try {
            await adminAuth.getUserByEmail(email);
        } catch (err: any) {
            console.warn(`[Verification] Attempt to send email to non-existent user: ${email}`);
            // Return success even if not found to prevent user enumeration
            return NextResponse.json({ success: true, message: "If the account exists, an email has been sent." });
        }

        // 2. Generate the official Firebase verification link
        const actionCodeSettings = {
            url: `${process.env.NEXT_PUBLIC_APP_URL || "https://underdeskflow.cl"}/login?verify=success`,
            handleCodeInApp: true,
        };

        const verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

        // 3. Dispatch via Resend (High deliverability)
        await sendVerificationEmail(email, verificationLink);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Verification API] Error:", error);
        return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
    }
}

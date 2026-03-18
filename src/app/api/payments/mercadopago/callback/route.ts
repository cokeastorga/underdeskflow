import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const storeId = searchParams.get("state"); // We securely passed storeId via the state param

    if (!code || !storeId) {
        return NextResponse.json({ error: "Missing required auth parameters (code or state)." }, { status: 400 });
    }

    const clientId = process.env.MP_CLIENT_ID;
    const clientSecret = process.env.MP_CLIENT_SECRET;
    
    // Unify appUrl logic to avoid drift between connect and callback
    const host = req.headers.get("host") || "";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const appUrl = `${protocol}://${host}`;

    if (!clientId || !clientSecret) {
         console.error("MP_CLIENT_ID or MP_CLIENT_SECRET is missing.");
         return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const redirectUri = `${appUrl}/api/payments/mercadopago/callback`;

    // --- PKCE Retrieval ---
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get("mp_code_verifier")?.value;
    
    // Clean up cookie immediately
    cookieStore.delete("mp_code_verifier");

    if (!codeVerifier) {
        console.warn("[MP Callback] Missing code_verifier in cookies.");
        // We will try without it just in case, or fail early. 
        // MP error said it's required, so we should probably fail.
        return NextResponse.json({ error: "Missing PKCE verifier (session expired or cookies blocked)." }, { status: 400 });
    }

    try {
        // Exchange code for Access Token
        const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: new URLSearchParams({
                client_secret: clientSecret,
                client_id: clientId,
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier // PKCE piece
            })
        });

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok) {
            console.error("[MP OAuth] Token Exchange Failed:", {
                status: tokenRes.status,
                data: tokenData,
                redirectUriUsed: redirectUri,
                clientIdUsed: clientId
            });
            return NextResponse.json({ 
                error: "Failed to exchange authorization code.",
                details: tokenData.message || "Unknown provider error",
                status: tokenRes.status
            }, { status: tokenRes.status });
        }

        const { access_token, refresh_token, public_key, user_id, expires_in } = tokenData;

        // Save safely to Firestore
        if (storeId === "HQ_PLATFORM") {
            await adminDb.doc(`system/config/integrations/mercadopago`).set({
                accessToken: access_token,
                refreshToken: refresh_token,
                publicKey: public_key,
                userId: user_id,
                expiresAt: Date.now() + (expires_in * 1000),
                enabled: true,
                updatedAt: Date.now(),
            }, { merge: true });

            const returnUrl = new URL(`/superadmin/integrations`, appUrl);
            returnUrl.searchParams.set("mp_connected", "true");
            return NextResponse.redirect(returnUrl.toString());
        } else {
            await adminDb.doc(`stores/${storeId}/integrations/mercadopago`).set({
                accessToken: access_token,
                refreshToken: refresh_token,
                publicKey: public_key,
                userId: user_id,
                expiresAt: Date.now() + (expires_in * 1000),
                enabled: true,
                updatedAt: Date.now(),
            }, { merge: true });

            // Redirect back to the tenant dashboard
            const returnUrl = new URL(`/tenant/payments`, appUrl);
            returnUrl.searchParams.set("mp_connected", "true");
            return NextResponse.redirect(returnUrl.toString());
        }

    } catch (err) {
        console.error("MercadoPago Callback Exception:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

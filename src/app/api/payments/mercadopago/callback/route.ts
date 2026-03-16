import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const storeId = searchParams.get("state"); // We securely passed storeId via the state param

    if (!code || !storeId) {
        return NextResponse.json({ error: "Missing required auth parameters (code or state)." }, { status: 400 });
    }

    const clientId = process.env.MP_CLIENT_ID;
    const clientSecret = process.env.MP_CLIENT_SECRET;
    
    // We use the same dynamic URL resolution as the middleware
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const vercelHost = process.env.VERCEL_URL;
    let appUrl = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') : "";
    if (!appUrl) {
        appUrl = vercelHost ? `${protocol}://${vercelHost}` : 'http://localhost:3000';
    }

    if (!clientId || !clientSecret) {
         console.error("MP_CLIENT_ID or MP_CLIENT_SECRET is missing.");
         return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const redirectUri = `${appUrl}/api/payments/mercadopago/callback`;

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
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok) {
            console.error("MP OAuth Error:", tokenData);
            return NextResponse.json({ error: "Failed to exchange authorization code." }, { status: tokenRes.status });
        }

        const { access_token, refresh_token, public_key, user_id, expires_in } = tokenData;

        // Save safely to Firestore
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

    } catch (err) {
        console.error("MercadoPago Callback Exception:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

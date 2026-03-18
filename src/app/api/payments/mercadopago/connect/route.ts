import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const storeId = searchParams.get("storeId");

    if (!storeId) {
        return NextResponse.json({ error: "Missing storeId" }, { status: 400 });
    }

    const clientId = process.env.MP_CLIENT_ID;
    
    // Dynamically determine the app URL from the request headers to be more robust
    const host = req.headers.get("host") || "";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const appUrl = `${protocol}://${host}`;
    
    console.log(`[MP Connect] Current host: ${host}, protocol: ${protocol}, appUrl: ${appUrl}`);

    if (!clientId) {
        console.error("MP_CLIENT_ID is missing in environment variables.");
        return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const redirectUri = `${appUrl}/api/payments/mercadopago/callback`;

    // --- PKCE Implementation ---
    // Mercado Pago is requesting code_verifier, so we implement the PKCE flow
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

    // Store the verifier in an HTTP-only cookie to retrieve it in the callback
    const cookieStore = await cookies();
    cookieStore.set("mp_code_verifier", codeVerifier, {
        httpOnly: true,
        secure: protocol === "https",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
    });
    console.log(`[MP Connect] Expected Redirect URI: ${redirectUri}`);
    
    // MP authorization URL
    const mpUrl = new URL("https://auth.mercadopago.com/authorization");
    mpUrl.searchParams.set("client_id", clientId);
    mpUrl.searchParams.set("response_type", "code");
    mpUrl.searchParams.set("platform_id", "mp");
    mpUrl.searchParams.set("state", storeId);
    mpUrl.searchParams.set("redirect_uri", redirectUri);
    // PKCE Params
    mpUrl.searchParams.set("code_challenge", codeChallenge);
    mpUrl.searchParams.set("code_challenge_method", "S256");
    // Added scopes
    mpUrl.searchParams.set("scope", "offline_access read write");

    console.log(`[MP Connect] Full MP Authorization URL: ${mpUrl.toString()}`);

    // Redirect the browser to Mercado Pago so the tenant can authorize us
    return NextResponse.redirect(mpUrl.toString());
}

/**
 * POST /api/webhooks/[provider]
 *
 * Receives all PSP webhooks. Key design rules:
 *  - Read raw body BEFORE parsing (required for signature validation)
 *  - ALWAYS return 200 OK — any non-2xx causes the PSP to retry indefinitely
 *  - Only return 400 for invalid signatures (tells PSP something is structurally wrong)
 *  - Provider is validated against the whitelist of known PSPs
 */
import { NextRequest, NextResponse } from "next/server";
import { paymentOrchestrator } from "@/lib/payments/orchestrator";
import { SupportedProvider, OrchestratorError } from "@/types/payments";

const VALID_PROVIDERS = new Set<string>(["stripe", "mercadopago", "flow", "webpay"]);

interface Params {
    params: Promise<{ provider: string }>;
}

export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
    const { provider } = await params;

    // Validate provider
    if (!VALID_PROVIDERS.has(provider)) {
        return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
    }

    // Read raw body bytes — MUST be raw for HMAC signature validation
    // (JSON.parse would alter byte order and break sig checks)
    const rawBody = Buffer.from(await request.arrayBuffer());

    // Extract all headers as plain object for adapters
    const headers: Record<string, string | string[] | undefined> = {};
    request.headers.forEach((value, key) => {
        headers[key] = value;
    });

    try {
        const result = await paymentOrchestrator.processWebhook(
            provider as SupportedProvider,
            rawBody,
            headers
        );

        // 200 always for valid signatures, regardless of dedup/ignored
        return NextResponse.json({ received: true, result });

    } catch (err) {
        if (err instanceof OrchestratorError && err.code === "WEBHOOK_SIGNATURE_INVALID") {
            // Return 400 intentionally — lets the PSP know the request is malformed
            // Do NOT return 401 (reveals too much info about auth mechanism)
            console.warn("[Webhook] Invalid signature", {
                provider,
                ip: request.headers.get("x-forwarded-for") ?? "unknown",
                error: err.context,
            });
            return NextResponse.json({ error: "Bad request" }, { status: 400 });
        }

        // Any unexpected error — log and return 200 so PSP doesn't retry forever.
        // We'll catch missed state changes via the reconciliation job.
        console.error("[Webhook] Unhandled error", {
            provider,
            error: (err as Error).message,
        });
        return NextResponse.json({ received: true, error: "processing_deferred" }, { status: 200 });
    }
}

/**
 * GET /api/webhooks/webpay/return (handled by same dynamic route for Webpay)
 *
 * Webpay and Flow redirect the user back to returnUrl with a token.
 * We treat these as webhook-equivalent events.
 */
export async function GET(request: NextRequest, { params }: Params): Promise<NextResponse> {
    const { provider } = await params;
    const url = new URL(request.url);
    const intentId = url.searchParams.get("intent_id");

    if (provider !== "webpay" && provider !== "flow") {
        return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Build a synthetic "body" from query params (Webpay sends token_ws as query param on return)
    const token = url.searchParams.get("token_ws") ?? url.searchParams.get("token");
    if (!token) {
        // User may have canceled — redirect to failure page
        const storeUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        return NextResponse.redirect(`${storeUrl}/checkout/failure?intent_id=${intentId ?? "unknown"}`);
    }

    const rawBody = Buffer.from(`token_ws=${token}`);
    const headers: Record<string, string | undefined> = {};

    try {
        await paymentOrchestrator.processWebhook(provider as SupportedProvider, rawBody, headers);
    } catch {
        // Even on error, redirect to a user-facing page (not a JSON error)
    }

    // Redirect to storefront outcome page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return NextResponse.redirect(`${baseUrl}/checkout/processing?intent_id=${intentId ?? "unknown"}`);
}

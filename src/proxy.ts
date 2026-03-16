import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};

export async function proxy(req: NextRequest) {
    const url = req.nextUrl;

    // ── 1. Auth guard (merged from proxy.ts) ────────────────────────────────
    // Protect all /tenant/* routes: redirect to /login if no __session cookie.
    if (url.pathname.startsWith('/tenant')) {
        const session = req.cookies.get('__session')?.value;
        if (!session) {
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    // ── 2. Custom-domain multi-tenant routing ────────────────────────────────
    // Get hostname (e.g. 'deliciasportenas.cl' or 'app.underdesk.com' or 'localhost:3000')
    let hostname = req.headers.get('host') || '';

    // Remove port for local testing
    hostname = hostname.replace(/:\d+$/, '');

    // Skip root domain and known SaaS subdomains — let App Router handle normally.
    const isAppDomain =
        hostname === 'localhost' ||
        hostname.endsWith('.vercel.app') || // Preview deployments
        hostname === 'underdesk.com' ||
        hostname === 'app.underdesk.com';

    if (isAppDomain) {
        return NextResponse.next();
    }

    // ── 3. Custom domain interception ────────────────────────────────────────
    // At this point the request is coming from a custom domain like 'deliciasportenas.cl'.
    // Fetch the storeId mapping from our Edge-friendly API (cached 60s via Next.js Data Cache).
    try {
        const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
        const vercelHost = process.env.VERCEL_URL;
        
        let appUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!appUrl) {
            appUrl = vercelHost ? `${protocol}://${vercelHost}` : 'http://localhost:3000';
        }

        const mappingRes = await fetch(
            `${appUrl}/api/edge/domain-lookup?hostname=${hostname}`,
            { next: { revalidate: 60 } } // 60-second TTL in Next.js Data Cache
        );

        if (!mappingRes.ok) {
            // Unregistered domain → serve the custom 404 page
            return NextResponse.rewrite(new URL('/404-domain', req.url));
        }

        const mapping = await mappingRes.json();
        const storeId: string | undefined = mapping.storeId;

        if (storeId) {
            // REWRITE MAGIC:
            // Browser URL stays "deliciasportenas.cl/products/123"
            // Internally routed to /storefront/[storeId]/products/123
            return NextResponse.rewrite(
                new URL(`/storefront/${storeId}${url.pathname}${url.search}`, req.url)
            );
        }
    } catch (err) {
        console.error('Middleware: Edge domain lookup failed', err);
        // Fail-safe: Instead of returning a forced 500 rewrite, let the request pass through.
        // If it's a storefront request, it might 404 naturally, but it won't crash the middleware.
        return NextResponse.next();
    }

    return NextResponse.next();
}

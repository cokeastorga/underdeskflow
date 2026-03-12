import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In Edge runtime, we cannot use 'firebase-admin'.
// Option A: Vercel Edge Config (ideal for this)
// Option B: Calling our own lightweight Next.js edge API route and caching it in node memory.
// For now, we simulate the structure and add a fetch proxy to our edge API.

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

export async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    
    // Get hostname (e.g. 'deliciasportenas.cl' or 'app.underdesk.com' or 'localhost:3000')
    let hostname = req.headers.get('host') || '';

    // Remove port for local testing
    hostname = hostname.replace(/:\d+$/, '');

    // Skip root domain and its subdomains if they belong to the SaaS App
    // e.g. "localhost", "underdesk.com", "app.underdesk.com"
    const isAppDomain = 
        hostname === 'localhost' || 
        hostname.endsWith('.vercel.app') || // Temp vercel domains
        hostname === 'underdesk.com' || 
        hostname === 'app.underdesk.com';

    if (isAppDomain) {
        // Normal SaaS behavior (App router handles /tenant/pos, /auth, etc.)
        return NextResponse.next();
    }

    // --- CUSTOM DOMAIN INTERCEPTION --- //
    // At this point, the request is coming from a custom domain like 'deliciasportenas.cl'

    // Real world: Fetch from Vercel Edge Config or Redis to avoid hitting our Next.js API/Firestore excessively.
    // For this boilerplate, we'll do an edge fetch to our own API (which handles Edge caching logic).
    
    try {
        // Define root URL for the fetch (has to be absolute)
        // Note: process.env.NEXT_PUBLIC_APP_URL should be set in Vercel to 'https://app.underdesk.com'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        // Fetch domain mapping via our Edge-friendly API
        const mappingRes = await fetch(`${appUrl}/api/edge/domain-lookup?hostname=${hostname}`, {
            next: { revalidate: 60 } // Built-in Next.js Data Cache (60 seconds TTL)
        });

        if (!mappingRes.ok) {
            // Unregistered Domain -> Serve a 404 Custom Domain page
            return NextResponse.rewrite(new URL(`/404-domain`, req.url));
        }

        const mapping = await mappingRes.json();
        const storeId = mapping.storeId;

        if (storeId) {
            // REWRITE MAGIC:
            // Rewrite the URL internally to /storefront/[storeId]/[...path]
            // From the browser perspective, the URL stays "deliciasportenas.cl/products/123"
            return NextResponse.rewrite(new URL(`/storefront/${storeId}${url.pathname}${url.search}`, req.url));
        }
        
    } catch (err) {
        console.error("Middleware Edge Lookup failed", err);
        // Fallback or error page
        return NextResponse.rewrite(new URL(`/500`, req.url));
    }

    return NextResponse.next();
}

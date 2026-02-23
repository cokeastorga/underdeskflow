import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    const session = request.cookies.get("__session")?.value;

    if (!session && request.nextUrl.pathname.startsWith("/tenant")) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/tenant/:path*"],
};

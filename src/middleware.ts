import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const sessionToken =
        req.cookies.get("__Secure-next-auth.session-token") || // Production (HTTPS)
        req.cookies.get("next-auth.session-token"); // Development (HTTP)

    if (!sessionToken && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};

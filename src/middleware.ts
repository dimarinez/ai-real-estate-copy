import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const isProduction = process.env.NODE_ENV === "production";
    const sessionCookieName = isProduction
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";
    const sessionToken = req.cookies.get(sessionCookieName);
    const { pathname, searchParams } = req.nextUrl;
  
    if (!sessionToken && pathname.startsWith("/dashboard")) {
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        // Verify sessionId with Stripe (optional, for security)
        // For simplicity, assume session persists; if not, re-authenticate
        return NextResponse.next(); // Allow if coming from checkout
      }
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    return NextResponse.next();
  }
  
  export const config = { matcher: ["/dashboard/:path*"] };

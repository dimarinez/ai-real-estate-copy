import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // 1. Identify environment
  const isProduction = process.env.NODE_ENV === "production";

  // 2. If in production, NextAuth sets a secure cookie: "__Secure-next-auth.session-token"
  //    If in development, it sets: "next-auth.session-token"
  const sessionCookieName = isProduction
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  // 3. Grab the cookie
  const sessionToken = req.cookies.get(sessionCookieName);

  // 4. Check if the user is requesting a protected route without a token
  const { pathname } = req.nextUrl;
  if (!sessionToken && pathname.startsWith("/dashboard")) {
    // 5. Redirect to sign-in if no token
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // 6. Otherwise, allow the request to continue
  return NextResponse.next();
}

// 7. Specify which routes this middleware applies to
export const config = {
    matcher: ["/dashboard/:path*"], // Exclude /api/webhook
};

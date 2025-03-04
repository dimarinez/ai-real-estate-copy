import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const sessionCookieName = isProduction
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
  const sessionToken = req.cookies.get(sessionCookieName);
  const { pathname } = req.nextUrl;

  // Redirect to sign-in if no session token and accessing a protected route
  if (!sessionToken && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};
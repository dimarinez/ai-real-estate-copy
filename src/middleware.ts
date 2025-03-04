import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isAuthenticated = req.cookies.get("next-auth.session-token"); // NextAuth session token

    if (!isAuthenticated && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};

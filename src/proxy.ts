import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("sarfraz_auth_session")?.value;
  const isAuthenticated = Boolean(sessionToken);

  // 1. Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. If authenticated, redirect away from /auth and /
  if (pathname === '/auth' || pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|.*\\.png$|.*\\.svg$).*)'],
};

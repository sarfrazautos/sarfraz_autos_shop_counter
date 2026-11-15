import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verify administrative session token from cookies
  const sessionToken =
    request.cookies.get('sarfraz_auth_session')?.value ||
    request.cookies.get('better-auth.session_token')?.value;

  const isAuthenticated = Boolean(sessionToken && sessionToken.trim().length > 0);

  // 1. Root redirect: authenticated to /dashboard, unauthenticated to /auth
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // 2. Prevent already-authenticated users from staying on login page
  if (pathname === '/auth') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 3. Frontend Route Guard: Lock all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Backend API Route Guard: Lock all private API routes
  if (pathname.startsWith('/api')) {
    // Delivery rider mobile pings and auth provider endpoints are exempt
    const isPublicApi =
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/riders');

    if (!isPublicApi && !isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Administrator authentication required to access this endpoint.',
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static chunks)
     * - _next/image (image optimization)
     * - favicon.ico, logo.png, icon.png, apple-icon.png (public branding assets)
     * - static image formats (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { NextResponse, type NextRequest } from 'next/server';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const hasAuthCookie =
      request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);

    if (!hasAuthCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Everything else matched by config is a permanently removed legacy URL
  return new NextResponse(null, { status: 410 });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/_mycart',
    '/_mycart/:path*',
    '/showroom',
    '/showroom/:path*',
    '/brand',
    '/brand/:path*',
    '/blog/latest-news-and-updates',
    '/blog/latest-news-and-updates/:path*',
    '/shop-online',
    '/shop-online/:path*',
    '/info',
    '/info/:path*',
    '/segway-electric-scooters',
    '/about-us',
    '/privacy_policy',
    '/security_policy',
    '/returns_policy',
    '/terms_of_use',
  ],
};

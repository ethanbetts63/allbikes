import { NextResponse } from 'next/server';

export function middleware() {
  return new NextResponse(null, { status: 410 });
}

export const config = {
  matcher: [
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

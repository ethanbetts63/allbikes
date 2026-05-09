import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const DISALLOWED_ROUTES = [
  '/admin/',
  '/dashboard/',
  '/api/',
  '/login',
  '/service-booking/confirmation',
  '/hire/confirmation',
  '/hire/processing',
  '/hire/book',
  '/terms',
  '/refunds',
  '/service/booking-terms/',
  '/checkout/',
  '/_mycart',
  '/security',
  '/privacy',
  '/brand/',
  '/blog/',
  '/about-us',
  '/showroom/',
  '/segway-electric-scooters',
  '/bikes/',
  '/info/',
  '/view-all/',
  '/shop-online/',
  '/about_us',
  '/gts-sport-300i',
  '/sym-mio-50i',
  '/*?main_page=',
  '/returns_policy',
  '/terms_of_use',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: DISALLOWED_ROUTES,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

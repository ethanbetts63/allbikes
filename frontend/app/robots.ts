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
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_ROUTES,
      },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'anthropic-ai', 'CCBot'],
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/llms.txt`],
  };
}

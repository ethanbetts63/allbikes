import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Motorcycle Hire Perth | Daily, Weekly & Monthly | ScooterShop',
  description: 'Hire a motorcycle in Perth from ScooterShop Dianella. Flexible daily, weekly, and monthly rates with maintained hire bikes.',
  canonicalPath: '/hire',
});

export { default } from '@/pages_vite/HireListPage';

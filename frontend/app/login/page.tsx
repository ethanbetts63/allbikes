import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Admin Login | ScooterShop',
  noindex: true,
});

export { default } from '@/pages_vite/LoginPage';

import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Admin Login',
  noindex: true,
});

export { default } from '@/page_components/LoginPage';

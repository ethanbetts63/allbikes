import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Hire Payment',
  noindex: true,
});

export { default } from '@/page_components/HirePaymentPage';

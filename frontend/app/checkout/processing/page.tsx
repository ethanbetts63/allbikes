import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Processing Payment',
  noindex: true,
});

export { default } from '@/page_components/CheckoutProcessingPage';

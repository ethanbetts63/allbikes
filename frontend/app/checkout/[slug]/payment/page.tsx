import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Payment | ScooterShop',
  noindex: true,
});

export { default } from '@/page_components/CheckoutPaymentPage';

import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Checkout | ScooterShop',
  noindex: true,
});

export { default } from '@/pages_vite/CheckoutPage';

import { buildMetadata } from '@/lib/seo';

import CheckoutPaymentScreen from './_components/CheckoutPaymentScreen';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Payment',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <CheckoutPaymentScreen />;
}

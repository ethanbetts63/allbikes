import { buildMetadata } from '@/lib/seo';

import CheckoutSuccessScreen from './_components/CheckoutSuccessScreen';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Order Confirmed',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <CheckoutSuccessScreen />;
}

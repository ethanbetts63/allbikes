import { buildMetadata } from '@/lib/seo';

import CheckoutErrorScreen from './_components/CheckoutErrorScreen';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Payment Confirmation Issue',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <CheckoutErrorScreen />;
}

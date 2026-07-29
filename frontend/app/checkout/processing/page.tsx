import { buildMetadata } from '@/lib/seo';

import CheckoutProcessingScreen from './_components/CheckoutProcessingScreen';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Processing Payment',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <CheckoutProcessingScreen />;
}

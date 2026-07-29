import { buildMetadata } from '@/lib/seo';

import HirePaymentScreen from './_components/HirePaymentScreen';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Hire Payment',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <HirePaymentScreen />;
}

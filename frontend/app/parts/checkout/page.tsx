import type { Metadata } from 'next';

import PartsCheckoutDetailsScreen from './_components/PartsCheckoutDetailsScreen';

export const metadata: Metadata = {
  title: 'Checkout | SYM Parts',
  robots: { index: false },
};

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <PartsCheckoutDetailsScreen />;
}

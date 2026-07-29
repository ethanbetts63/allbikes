import type { Metadata } from 'next';
import { Suspense } from 'react';

import PartsCheckoutPaymentScreen from './_components/PartsCheckoutPaymentScreen';

export const metadata: Metadata = {
  title: 'Payment | SYM Parts',
  robots: { index: false },
};

// Server Component: it exports `metadata`, and the Suspense boundary is what
// useSearchParams needs below it during a static build.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PartsCheckoutPaymentScreen />
    </Suspense>
  );
}

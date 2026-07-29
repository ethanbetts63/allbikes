import type { Metadata } from 'next';
import { Suspense } from 'react';

import PartsConfirmationScreen from './_components/PartsConfirmationScreen';

export const metadata: Metadata = {
  title: 'Order Confirmation | SYM Parts',
  robots: { index: false },
};

// Server Component: it exports `metadata`, and the Suspense boundary is what
// useSearchParams needs below it during a static build.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PartsConfirmationScreen />
    </Suspense>
  );
}

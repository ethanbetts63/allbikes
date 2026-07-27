import type { Metadata } from 'next';
import { Suspense } from 'react';
import PartsCheckoutPaymentPage from './PartsCheckoutPaymentPage';

export const metadata: Metadata = {
  title: 'Payment | SYM Parts',
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PartsCheckoutPaymentPage />
    </Suspense>
  );
}

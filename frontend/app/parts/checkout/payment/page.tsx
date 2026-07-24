import type { Metadata } from 'next';
import { Suspense } from 'react';
import PartsCheckoutPaymentPage from '@/page_components/parts/PartsCheckoutPaymentPage';

export const metadata: Metadata = {
  title: 'Payment | SYM Spare Parts',
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PartsCheckoutPaymentPage />
    </Suspense>
  );
}

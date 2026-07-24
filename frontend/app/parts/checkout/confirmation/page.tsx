import type { Metadata } from 'next';
import { Suspense } from 'react';
import PartsCheckoutConfirmationPage from '@/page_components/parts/PartsCheckoutConfirmationPage';

export const metadata: Metadata = {
  title: 'Order Confirmation | SYM Spare Parts',
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PartsCheckoutConfirmationPage />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import PartsCheckoutConfirmationPage from './PartsCheckoutConfirmationPage';

export const metadata: Metadata = {
  title: 'Order Confirmation | SYM Parts',
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PartsCheckoutConfirmationPage />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import PartsCheckoutDetailsPage from '@/page_components/parts/PartsCheckoutDetailsPage';

export const metadata: Metadata = {
  title: 'Checkout | SYM Spare Parts',
  robots: { index: false },
};

export default function Page() {
  return <PartsCheckoutDetailsPage />;
}

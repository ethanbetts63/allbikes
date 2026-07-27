import type { Metadata } from 'next';
import PartsCheckoutDetailsPage from './PartsCheckoutDetailsPage';

export const metadata: Metadata = {
  title: 'Checkout | SYM Parts',
  robots: { index: false },
};

export default function Page() {
  return <PartsCheckoutDetailsPage />;
}

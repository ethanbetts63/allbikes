import type { Metadata } from 'next';
import PartsCartPage from '@/page_components/parts/PartsCartPage';

export const metadata: Metadata = {
  title: 'Parts Cart | SYM Spare Parts',
  robots: { index: false },
};

export default function Page() {
  return <PartsCartPage />;
}

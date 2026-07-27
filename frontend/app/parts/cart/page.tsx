import type { Metadata } from 'next';
import PartsCartPage from './PartsCartPage';

export const metadata: Metadata = {
  title: 'Parts Cart | SYM Parts',
  robots: { index: false },
};

export default function Page() {
  return <PartsCartPage />;
}

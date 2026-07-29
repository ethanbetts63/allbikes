import type { Metadata } from 'next';

import PartsCartScreen from './_components/PartsCartScreen';

export const metadata: Metadata = {
  title: 'Parts Cart | SYM Parts',
  robots: { index: false },
};

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <PartsCartScreen />;
}

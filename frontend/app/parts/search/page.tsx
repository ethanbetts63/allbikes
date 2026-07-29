import type { Metadata } from 'next';
import { Suspense } from 'react';

import PartsSearchScreen from './_components/PartsSearchScreen';

export const metadata: Metadata = {
  title: 'Search SYM Parts',
  robots: { index: false },
};

export default function Page() {
  // Client-side search: navigation is instant and the spinner shows on every
  // submit, rather than blocking the previous page until results return.
  return (
    <Suspense>
      <PartsSearchScreen />
    </Suspense>
  );
}

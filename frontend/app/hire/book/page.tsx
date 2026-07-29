import { buildMetadata } from '@/lib/seo';

import HireBookingScreen from './_components/HireBookingScreen';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Complete Hire Booking',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <HireBookingScreen />;
}

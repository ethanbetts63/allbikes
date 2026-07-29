import { buildMetadata } from '@/lib/seo';

import ServiceBookingScreen from './_components/ServiceBookingScreen';

// Steps 2–3 of the booking wizard. Step 1 lives on /service, which is the
// indexed entry point; this mid-flow page is deliberately kept out of search.
export const metadata = buildMetadata({
  title: 'Complete Your Service Booking',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <ServiceBookingScreen />;
}

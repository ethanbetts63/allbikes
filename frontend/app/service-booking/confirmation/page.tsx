import { buildMetadata } from '@/lib/seo';

import ServiceBookingConfirmationScreen from './_components/ServiceBookingConfirmationScreen';

export const metadata = buildMetadata({
  title: 'Service Request Submitted',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <ServiceBookingConfirmationScreen />;
}

import { buildMetadata } from '@/lib/seo';

import HireConfirmationScreen from './_components/HireConfirmationScreen';

export const metadata = buildMetadata({
  title: 'Hire Booking Confirmed',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <HireConfirmationScreen />;
}

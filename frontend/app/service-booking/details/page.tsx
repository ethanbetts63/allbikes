import { buildMetadata } from '@/lib/seo';

// Steps 2–3 of the booking wizard. Step 1 lives on /service, which is the
// indexed entry point; this mid-flow page is deliberately kept out of search.
export const metadata = buildMetadata({
  title: 'Complete Your Service Booking',
  noindex: true,
});

export { default } from './ServiceBookingPage';

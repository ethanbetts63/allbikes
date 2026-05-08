import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Terms & Conditions | ScooterShop',
  description: 'Read the terms and conditions for ScooterShop purchases, hire, and service bookings.',
  canonicalPath: '/terms',
});

export { default } from '@/pages_vite/TermsAndConditionsPage';

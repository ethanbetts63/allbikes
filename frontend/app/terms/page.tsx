import { buildMetadata } from '@/lib/seo';
import { getServerLatestTermsAndConditions } from '@/lib/serverApi';
import type { TermsAndConditions } from '@/types/TermsAndConditions';
import TermsAndConditionsPage from '@/pages_vite/TermsAndConditionsPage';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Terms & Conditions | ScooterShop',
  description: 'Read the terms and conditions for ScooterShop purchases, hire, and service bookings.',
  canonicalPath: '/terms',
});

interface TermsPageProps {
  searchParams?: {
    type?: string;
  };
}

export default async function Page({ searchParams }: TermsPageProps) {
  const type = normalizeTermsType(searchParams?.type);
  const terms = await fetchLatestTerms(type);

  return <TermsAndConditionsPage initialTerms={terms} />;
}

function normalizeTermsType(type?: string) {
  if (type === 'hire' || type === 'service' || type === 'purchase') {
    return type;
  }

  return undefined;
}

async function fetchLatestTerms(type?: 'hire' | 'service' | 'purchase'): Promise<TermsAndConditions | null> {
  try {
    return await getServerLatestTermsAndConditions(type);
  } catch (error) {
    console.error('Failed to server-render terms and conditions:', error);
    return null;
  }
}

import type { TermsAndConditions } from '@/types/TermsAndConditions';
import { buildMetadata } from '@/lib/seo';
import { getServerLatestTermsAndConditions } from '@/lib/serverApi';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Terms & Conditions',
  description: 'Read the terms and conditions for online purchases, motorcycle hire, service bookings, payments, cancellations, and website use.',
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

interface TermsAndConditionsPageProps {
    initialTerms: TermsAndConditions | null;
}

const TermsAndConditionsPage = ({ initialTerms }: TermsAndConditionsPageProps) => {
    return (
        <>
            <div className="container mx-auto px-4 py-8 max-w-4xl prose dark:prose-invert text-[var(--text-light-primary)]">
                {initialTerms ? (
                    <div dangerouslySetInnerHTML={{ __html: initialTerms.content }} />
                ) : (
                    <div>
                        <h2>Error</h2>
                        <p>Failed to load terms and conditions.</p>
                    </div>
                )}
            </div>
        </>
    );
};

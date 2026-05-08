import type { TermsAndConditions } from '@/types/TermsAndConditions';
import Seo from '@/components/Seo';

interface TermsAndConditionsPageProps {
    initialTerms: TermsAndConditions | null;
}

const TermsAndConditionsPage = ({ initialTerms }: TermsAndConditionsPageProps) => {
    return (
        <>
            <Seo
                title="Terms & Conditions | ScooterShop"
                description="Read the Terms & Conditions for purchasing and using Allbikes & Scooters products and services."
                canonicalPath="/terms"
            />
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

export default TermsAndConditionsPage;

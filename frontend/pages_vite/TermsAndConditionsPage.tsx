import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLatestTermsAndConditions } from '@/api';
import type { TermsAndConditions } from '@/types/TermsAndConditions';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';

const TermsAndConditionsPage = () => {
    const [searchParams] = useSearchParams();
    const termType = searchParams.get('type') as 'hire' | 'service' | 'purchase' | null;

    const [terms, setTerms] = useState<TermsAndConditions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                setIsLoading(true);
                const data = await getLatestTermsAndConditions(termType ?? undefined);
                setTerms(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load terms and conditions.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTerms();
    }, [termType]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Spinner className="w-8 h-8 mr-2" />
                    <p>Loading...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div>
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            );
        }

        if (terms) {
            return (
                <div dangerouslySetInnerHTML={{ __html: terms.content }} />
            );
        }

        return null;
    };

    return (
        <>
            <Seo
                title="Terms & Conditions | ScooterShop"
                description="Read the Terms & Conditions for purchasing and using Allbikes & Scooters products and services."
                canonicalPath="/terms"
            />
            <div className="container mx-auto px-4 py-8 max-w-4xl prose dark:prose-invert text-[var(--text-light-primary)]">
                {renderContent()}
            </div>
        </>
    );
};

export default TermsAndConditionsPage;

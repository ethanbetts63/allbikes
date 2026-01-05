import React, { useState, useEffect } from 'react';
import { getLatestTermsAndConditions } from '@/api';
import type { TermsAndConditions } from '@/types';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';

const TermsAndConditionsPage: React.FC = () => {
    const [terms, setTerms] = useState<TermsAndConditions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                setIsLoading(true);
                const data = await getLatestTermsAndConditions();
                setTerms(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load terms and conditions.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTerms();
    }, []);

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
            <Seo title="Terms & Conditions | Allbikes" />
            <div className="container mx-auto px-4 py-8 max-w-4xl prose dark:prose-invert">
                {renderContent()}
            </div>
        </>
    );
};

export default TermsAndConditionsPage;

import React, { useState, useEffect } from 'react';
import { getJobTypes } from '@/services/bookingService';
import type { EnrichedJobType } from '@/types';
import WorkshopJobTypes from '@/components/WorkshopJobTypes';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import ServiceBrands from "@/components/ServiceBrands";
import MotorcycleMovers from "@/components/MotorcycleMovers";

const WorkshopPage: React.FC = () => {
    const [jobTypes, setJobTypes] = useState<EnrichedJobType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJobTypes = async () => {
            setIsLoading(true);
            try {
                const data = await getJobTypes();
                setJobTypes(data);
            } catch (error) {
                console.error("Failed to fetch job types:", error);
                toast.error("Could not load our services. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobTypes();
    }, []);

    return (
        <div className="container mx-auto py-2">            
            {isLoading ? (
                <div className="flex justify-center">
                    <Spinner />
                </div>
            ) : (
                <WorkshopJobTypes jobTypes={jobTypes} />
            )}

            <div className="mt-4">
                <ServiceBrands />
            </div>

            <div className="mt-12">
                <MotorcycleMovers />
            </div>
        </div>
    );
};

export default WorkshopPage;

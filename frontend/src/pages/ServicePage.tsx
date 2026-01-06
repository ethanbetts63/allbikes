import React, { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import { getJobTypes } from '@/services/bookingService';
import type { EnrichedJobType } from '@/types';
import WorkshopJobTypes from '@/components/WorkshopJobTypes';
import { toast } from 'sonner';
import ServiceBrands from "@/components/ServiceBrands";
import MotorcycleMovers from "@/components/MotorcycleMovers";
import { FaqSection } from "@/components/FaqSection";
import { FloatingActionButton } from '@/components/FloatingActionButton'; 

const ServiceFaqs = [
  {
    question: "Do you offer tyre changes for motorcycles and scooters?",
    answer: "Yes. We provide motorcycle and scooter tyre changes, including tyre replacement, fitting, and balancing. We work on both motorcycles and scooters and can supply and fit tyres or fit tyres you provide, depending on the job."
  },
  {
    question: "Do you service Vespa or Piaggio scooters?",
    answer: "Yes. We have long specialised in Vespa and Piaggio scooters and have extensive experience servicing and repairing both brands. The business has a strong history with Vespa in Perth, with owner Frank previously operating the primary Vespa dealership in the area."
  },
  {
    question: "Do you service 50cc scooters?",
    answer: "Yes. We service 50cc scooters as well as larger-capacity scooters, providing servicing, repairs, and tyre changes where applicable."
  },
  {
    question: "Do you service dirt bikes?",
    answer: "Yes. We service dirt bikes, providing maintenance and mechanical repairs. If you’re unsure whether your specific model is suitable, feel free to get in touch."
  },
  {
    question: "Do you service electric scooters?",
    answer: "Yes. We service electric scooters and electric mopeds, including electric motorcycle-style scooters. We do not service electric kick scooters."
  },
  {
    question: "Do you offer mobile motorcycle or scooter mechanic services?",
    answer: "We work closely with Perth Motorcycle and Scooter Movers. If you’re unable to transport your bike, pickup and delivery can be arranged easily and affordably to and from our workshop."
  }
];

const ServicePage: React.FC = () => {
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
        <div className="container mx-auto py-0">
            <Seo
                title="Motorcycle/Scooter Servicing and Tyre Fitting | Allbikes Vespa Warehouse"
                description="Expert motorcycle and scooter servicing, repairs, and tyre changes in Perth. We service all major brands, including Vespa, Piaggio, and more."
                canonicalPath="/service"
            />
            <WorkshopJobTypes jobTypes={jobTypes} isLoading={isLoading} />

            <div className="mt-0">
                <ServiceBrands />
            </div>

            <div className="mt-8 mb-4">
                <MotorcycleMovers />
            </div>
            <FaqSection title="Workshop FAQ" faqData={ServiceFaqs} />
            <FloatingActionButton /> 
        </div>
    );
};

export default ServicePage;

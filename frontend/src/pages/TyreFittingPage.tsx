import React, { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import { getJobTypes } from '@/services/bookingService';
import type { EnrichedJobType, } from '@/types';
import WorkshopJobTypes from '@/components/WorkshopJobTypes';
import ServiceBrands from "@/components/ServiceBrands";
import MotorcycleMovers from "@/components/MotorcycleMovers";
import { FaqSection } from "@/components/FaqSection";
import { FloatingActionButton } from '@/components/FloatingActionButton';
import Breadcrumb, { type BreadcrumbItem } from '@/components/Breadcrumb';

const TyreFittingFaqs = [
  {
    question: "Do you offer tyre changes for motorcycles and scooters?",
    answer: "Yes. We provide motorcycle and scooter tyre changes, including tyre replacement, fitting, and balancing. We work on both motorcycles and scooters and can supply and fit tyres or fit tyres you provide, depending on the job."
  },
  {
    question: "Can you fit tyres I supply myself?",
    answer: "Yes, we can fit tyres that you provide. Please ensure they are the correct size and type for your motorcycle or scooter. We also offer a wide range of tyres for purchase if you prefer."
  },
  {
    question: "What is the cost of tyre fitting?",
    answer: "The cost of tyre fitting can vary depending on the type of bike and the complexity of the job. For a precise quote, please get in touch with us with your bike's details and tyre specifications."
  },
  {
    question: "Do you offer wheel balancing?",
    answer: "Yes, wheel balancing is a standard part of our tyre fitting service to ensure a smooth and safe ride."
  },
  {
    question: "How long does a tyre fitting take?",
    answer: "Tyre fitting times can vary, but we strive to complete the service as efficiently as possible. It typically takes about an hour, but complex jobs may take longer. We recommend booking in advance."
  },
  {
    question: "Do you offer mobile tyre fitting services?",
    answer: "We work closely with Perth Motorcycle and Scooter Movers. If you’re unable to transport your bike for a tyre fitting, pickup and delivery can be arranged easily and affordably to and from our workshop."
  }
];

const TyreFittingPage: React.FC = () => {
    const [jobTypes, setJobTypes] = useState<EnrichedJobType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJobTypes = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getJobTypes();
                setJobTypes(data);
            } catch (error) {
                console.error("Failed to fetch job types:", error);
                setError("Could not load our services. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobTypes();
    }, []);

    const breadcrumbItems: BreadcrumbItem[] = [
        { name: 'Home', href: '/' },
        { name: 'Tyre Fitting', href: '/tyre-fitting' },
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbItems.map((item, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": item.name,
                    "item": `https://www.allbikesvespawarehouse.com.au${item.href}`
                }))
            },
            {
                "@type": "Service",
                "serviceType": "Motorcycle and scooter tyre fitting",
                "provider": {
                    "@type": "Organization",
                    "name": "Allbikes Vespa Warehouse"
                },
                "description": "Expert motorcycle and scooter tyre fitting, replacement, and balancing in Perth. We service all major brands and models.",
                "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Tyre Fitting Services",
                    "itemListElement": jobTypes.map(job => ({
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": job.name,
                            "description": job.description
                        }
                    }))
                }
            }
        ]
    };

    return (
        <div className="container mx-auto py-0">
            <Seo
                title="Motorcycle/Scooter Tyre Fitting | Allbikes Vespa Warehouse"
                description="Expert motorcycle and scooter tyre fitting, replacement, and balancing in Perth. We service all major brands and models."
                canonicalPath="/tyre-fitting"
                structuredData={structuredData}
            />
            <Breadcrumb items={breadcrumbItems} />
            <WorkshopJobTypes
                jobTypes={jobTypes}
                isLoading={isLoading}
                error={error}
                title="Book Your Tyre Fitting"
                paragraph="Ready for new tyres? Our expert mechanics are here to help. From tyre fitting to wheel balancing, we've got you covered. Use our online booking system to find a time that works for you."
                buttonText="Book Tyre Fitting Online"
            />

            <div className="mt-0">
                <ServiceBrands />
            </div>

            <div className="mt-8 mb-4">
                <MotorcycleMovers />
            </div>
            <FaqSection title="Tyre Fitting FAQ" faqData={TyreFittingFaqs} />
            <FloatingActionButton />
        </div>
    );
};

export default TyreFittingPage;

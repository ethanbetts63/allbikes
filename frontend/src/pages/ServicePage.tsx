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

const ServiceFaqs = [
  {
    question: "Do you offer motorcycle and scooter tyre fitting?",
    answer: "Yes. We specialise in motorcycle and scooter tyre fitting, including tyre install, motorcycle tyre change, and scooter tyre change. We can supply and fit tyres or install tyres you provide, depending on the job."
  },
  {
    question: "Do you fit tyres on Vespa and Piaggio scooters?",
    answer: "Yes. We have extensive experience fitting scooter tyres on Vespa and Piaggio models. This includes scooter tyre replacement, tyre repair, and flat tyre repair. The business has a long history with Vespa in Perth, with owner Frank previously operating the primary Vespa dealership."
  },
  {
    question: "Do you do tyre changes on 50cc scooters?",
    answer: "Yes. We perform tyre fitting and scooter tyre replacement on 50cc scooters, as well as larger-capacity scooters, including puncture repair and tyre install where applicable."
  },
  {
    question: "Do you fit tyres on dirt bikes?",
    answer: "Yes. We offer motorcycle tyre replacement and tyre fitting for dirt bikes, including flat tyre repair and puncture repair. If you’re unsure whether your specific bike is suitable, feel free to get in touch."
  },
  {
    question: "Do you work on electric scooter tyres?",
    answer: "Yes. We provide tyre fitting and tyre repair for electric scooters and electric motorcycle-style scooters. We do not work on electric kick scooter tires."
  },
  {
    question: "Can you help if I have a flat tyre and can’t transport my bike?",
    answer: "Yes. If you’re dealing with a flat tyre repair or motorcycle tyre change and can’t transport your bike, we work closely with Perth Motorcycle and Scooter Movers to arrange affordable pickup and delivery."
  }
];


const ServicePage: React.FC = () => {
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
        { name: 'Servicing & Tyres', href: '/service' },
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
                "serviceType": "Motorcycle and scooter servicing and repairs",
                "provider": {
                    "@type": "Organization",
                    "name": "Allbikes Vespa Warehouse"
                },
                "description": "Expert motorcycle and scooter servicing, repairs, and tyre changes in Perth. We service all major brands, including Vespa, Piaggio, and more.",
                "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Workshop Services",
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
                title="Motorcycle/Scooter Servicing and Tyre Fitting | Allbikes Vespa Warehouse"
                description="Expert motorcycle and scooter servicing, repairs, and tyre changes in Perth. We service all major brands, including Vespa, Piaggio, and more."
                canonicalPath="/service"
                structuredData={structuredData}
            />
            <Breadcrumb items={breadcrumbItems} />
            <WorkshopJobTypes
                jobTypes={jobTypes}
                isLoading={isLoading}
                error={error}
                title="Book Your Service"
                paragraph="Ready to get your motorcycle or scooter in top shape? Our expert mechanics are here to help. From routine maintenance to complex repairs, we've got you covered. Use our online booking system to find a motorcycle or moped tyre fitting time that works for you."
                buttonText="Book Service Online"
            />

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

import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import MotorcycleMovers from "@/components/MotorcycleMovers";
import { FaqSection } from "@/components/FaqSection";
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Activity, CircleDot, ArrowRight } from 'lucide-react';
import ServiceCTAV2 from '@/components/ServiceCTAV2';

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
    answer: "Yes. We offer motorcycle tyre replacement and tyre fitting for dirt bikes, including flat tyre repair and puncture repair. If you're unsure whether your specific bike is suitable, feel free to get in touch."
  },
  {
    question: "Do you work on electric scooter tyres?",
    answer: "Yes. We provide tyre fitting and tyre repair for electric scooters and electric motorcycle-style scooters. We do not work on electric kick scooter tyres."
  },
  {
    question: "Can you help if I have a flat tyre and can't transport my bike?",
    answer: "Yes. If you're dealing with a flat tyre or motorcycle tyre change and can't ride your bike in, we work closely with Perth Motorcycle and Scooter Movers to arrange affordable pickup and delivery."
  }
];

const services = [
  {
    Icon: AlertCircle,
    title: 'No-Start Diagnosis & Service',
    description: "Your bike won't fire up? We'll identify the root cause — electrical, fuel, or mechanical — and carry out all required work to get you back on the road.",
  },
  {
    Icon: Activity,
    title: 'Running Bike Diagnosis & Service',
    description: 'Something feeling off, or just due for a service? We perform a thorough inspection and carry out any required maintenance or repairs to keep your bike running at its best.',
  },
  {
    Icon: CircleDot,
    title: 'Tyre Fitting',
    description: 'Supply and fit, or fit-only. We handle tyre changes, replacements, and wheel balancing for all motorcycles and scooters.',
  },
];

const breadcrumbItems = [
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
                "item": `https://www.scootershop.com.au${item.href}`
            }))
        },
        {
            "@type": "Service",
            "serviceType": "Motorcycle and scooter servicing and repairs",
            "provider": {
                "@type": "Organization",
                "name": "Allbikes & Scooters"
            },
            "description": "Expert motorcycle and scooter servicing, repairs, and tyre fitting in Perth.",
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Workshop Services",
                "itemListElement": services.map(s => ({
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": s.title,
                        "description": s.description
                    }
                }))
            }
        }
    ]
};

const ServicePage = () => {
    return (
        <div>
            <Seo
                title="Motorcycle & Scooter Servicing | Allbikes & Scooters Perth"
                description="Expert motorcycle and scooter servicing, repairs, and tyre fitting in Perth. Book online today."
                canonicalPath="/service"
                structuredData={structuredData}
            />

            <ServiceCTAV2 />

            {/* Services */}
            <div className="bg-background pt-8 pb-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-[var(--text-light-primary)] mb-12">What We Do</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {services.map(({ Icon, title, description }) => (
                            <div key={title} className="bg-foreground rounded-lg p-8 flex flex-col gap-4">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-highlight/20">
                                    <Icon className="h-7 w-7 text-highlight1" />
                                </div>
                                <h3 className="text-2xl font-bold text-[var(--text-light-primary)]">{title}</h3>
                                <p className="text-[var(--text-light-secondary)] text-lg leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <Link to="/booking">
                            <Button className="bg-highlight1 hover:bg-highlight1/80 text-[var(--text-dark-primary)] font-bold px-8 py-5 text-lg inline-flex items-center gap-2">
                                Book Online <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Motorcycle Movers */}
            <div className="container mx-auto px-4 mb-4">
                <MotorcycleMovers />
            </div>

            <FaqSection title="Workshop FAQ" faqData={ServiceFaqs} />

            <FloatingActionButton />
        </div>
    );
};

export default ServicePage;

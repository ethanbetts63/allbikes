import Link from 'next/link';
import StructuredDataScript from '@/components/StructuredDataScript';
import MotorcycleMovers from "@/components/MotorcycleMovers";
import { FaqSection } from "@/components/FaqSection";
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Activity, CircleDot, ArrowRight } from 'lucide-react';
import ServiceCTAV2 from '@/components/ServiceCTAV2';
import ServiceAreasSection from '@/components/ServiceAreasSection';
import FeaturedBikes from '@/components/FeaturedBikes';
import { buildBreadcrumbSchema, buildServiceSchema, buildFaqSchema } from '@/lib/seo';
import type { Bike } from '@/types/Bike';

const motorcycleCheckItems = [
    'Full motorcycle servicing & repairs',
    'Honda, Yamaha, Kawasaki, Suzuki, Ducati & more',
    'Tyre fitting & wheel balancing',
    'Puncture & flat tyre repair',
    "Can't move your motorcycle? Pickup can be arranged",
];

const motorcycleFaqs = [
    {
        question: "Do you service all motorcycle brands?",
        answer: "Yes. We work on all makes and models, including Honda, Yamaha, Kawasaki, Suzuki, Ducati, Triumph, BMW, KTM, Aprilia, and more. If you're unsure whether we can help with your specific motorcycle, get in touch."
    },
    {
        question: "Do you service both road bikes and dirt bikes?",
        answer: "Yes. We service road-registered motorcycles as well as dirt bikes and off-road bikes. This includes sports bikes, cruisers, nakeds, adventure bikes, and motocross bikes."
    },
    {
        question: "What does a motorcycle service include?",
        answer: "A standard service covers an oil and filter change, air filter inspection, chain and sprocket check, brake inspection, and a general mechanical check. The scope of work depends on the service interval and the condition of the bike — we'll advise you on what's needed when we assess it."
    },
    {
        question: "Do you fit motorcycle tyres?",
        answer: "Yes. We supply and fit, or fit-only, across all motorcycle tyre sizes — sports, touring, cruiser, and dual-sport. See our tyre fitting page for more detail."
    },
    {
        question: "Can you help if I have a flat tyre and can't transport my motorcycle?",
        answer: "Yes. We work closely with Perth Motorcycle and Scooter Movers to arrange affordable pickup and delivery if you can't ride your motorcycle in."
    },
    {
        question: "Do you do roadworthy inspections?",
        answer: "Get in touch to discuss your specific requirements — we can advise on whether a roadworthy or compliance check is something we can assist with."
    }
];

const services = [
    {
        Icon: AlertCircle,
        title: 'No-Start Diagnosis & Service',
        description: "Your motorcycle won't fire up? We diagnose and fix the root cause — electrical fault, fuel delivery, or mechanical failure. No guesswork, just the work needed to get you riding again.",
    },
    {
        Icon: Activity,
        title: 'Running Motorcycle Diagnosis & Service',
        description: "Routine service or something doesn't feel right? We run a thorough mechanical check and handle whatever the bike needs — keeping your motorcycle reliable and safe on the road.",
    },
    {
        Icon: CircleDot,
        title: 'Tyre Fitting',
        description: 'Supply and fit, or fit-only. We work across all motorcycle tyre sizes and styles — sports, touring, cruiser, and dual-sport.',
    },
];

const structuredData = [
    buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Servicing & Tyres', path: '/service' },
        { name: 'Motorcycle Service & Repairs', path: '/motorcycle-service' },
    ]),
    buildServiceSchema({
        serviceType: 'Motorcycle servicing and repairs',
        path: '/motorcycle-service',
        description: 'Expert motorcycle servicing, repairs, and tyre fitting in Perth. Honda, Yamaha, Kawasaki, Suzuki, Ducati, and all major brands.',
        catalogName: 'Motorcycle Workshop Services',
        offers: services.map((s) => ({ name: s.title, description: s.description })),
    }),
    buildFaqSchema(motorcycleFaqs),
].filter(Boolean) as object[];

interface MotorcycleServicePageProps {
    initialUsedMotorcycles: Bike[];
}

const MotorcycleServicePage = ({ initialUsedMotorcycles }: MotorcycleServicePageProps) => {
    return (
        <div>
            <StructuredDataScript structuredData={structuredData} />

            <ServiceCTAV2
                headingLines={['Get Your', 'Motorcycle', 'Sorted.']}
                checkItems={motorcycleCheckItems}
                subtitle="Experienced motorcycle mechanics who have been keeping Perth riders on the road for decades. Book your service online in minutes."
            />

            {/* Services */}
            <div className="bg-background pt-8 pb-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-[var(--text-light-primary)] mb-12">What We Do</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {services.map(({ Icon, title, description }) => (
                            <div key={title} className="bg-foreground rounded-lg p-8 flex flex-col gap-4">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-highlight1/20">
                                    <Icon className="h-7 w-7 text-highlight1" />
                                </div>
                                <h3 className="text-2xl font-bold text-[var(--text-light-primary)]">{title}</h3>
                                <p className="text-[var(--text-light-secondary)] text-lg leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-8 text-center text-[var(--text-light-secondary)] text-lg">
                        Need tyres as part of the job? See our{' '}
                        <Link href="/tyre-fitting" className="text-highlight1 font-semibold underline underline-offset-4 hover:text-highlight1/80">
                            motorcycle tyre fitting
                        </Link>
                        {'. Also see our '}
                        <Link href="/service" className="text-highlight1 font-semibold underline underline-offset-4 hover:text-highlight1/80">
                            general workshop page
                        </Link>
                        .
                    </p>
                    <div className="text-center mt-10">
                        <Link href="/service-booking">
                            <Button className="bg-highlight1 hover:bg-highlight1/80 text-[var(--text-light-primary)] font-bold px-8 py-5 text-lg inline-flex items-center gap-2">
                                Book Online <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <ServiceAreasSection
                headingLines={['Serving', 'Perth', 'Motorcycle Riders.']}
                prose1="Our workshop is in Dianella, making it easy to get to from the northern suburbs and inner city. We regularly work on motorcycles coming in from Morley, Yokine, Inglewood, Mount Lawley, North Perth, Northbridge, and the Perth CBD."
                prose2="Motorcycle riders also come to us from further out — Scarborough, Osborne Park, Subiaco, Fremantle, and Cottesloe. If you're after a motorcycle mechanic near you, chances are we're not far away."
            />

            <MotorcycleMovers />

            {initialUsedMotorcycles.length > 0 && (
                <FeaturedBikes
                    title="Thinking of Upgrading Your Motorcycle?"
                    bikes={initialUsedMotorcycles}
                    description="Browse our current used motorcycles while your ride is in the workshop."
                    linkTo="/inventory/motorcycles/used"
                    linkText="View All Used Motorcycles"
                />
            )}

            <FaqSection title="Motorcycle Servicing FAQ" faqData={motorcycleFaqs} />

            <FloatingActionButton />
        </div>
    );
};

export default MotorcycleServicePage;

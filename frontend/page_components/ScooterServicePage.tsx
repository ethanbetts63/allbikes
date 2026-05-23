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

const scooterCheckItems = [
    'Full scooter servicing & repairs',
    'Vespa, Piaggio, Aprilia & all major brands',
    'Tyre fitting & wheel balancing',
    'Puncture & flat tyre repair',
    'Electric scooter servicing',
    "Can't move your scooter? Pickup can be arranged",
];

const scooterFaqs = [
    {
        question: "Do you service all scooter brands?",
        answer: "Yes. We work on all makes and models. We have a long history with Italian brands — Vespa, Piaggio, and Aprilia — but regularly service all major brands including Honda, Yamaha, Sym, Kymco, TGB, and Bolwell. If you're unsure whether we can help with your specific scooter, get in touch."
    },
    {
        question: "Do you service 50cc scooters?",
        answer: "Yes. We service and repair all engine capacities, from 50cc scooters up to maxi-scooters. This includes carburettor cleaning, servicing, and mechanical repairs."
    },
    {
        question: "Do you service Vespa and Piaggio scooters?",
        answer: "Yes. We have decades of experience with Vespa and Piaggio. The business was previously Perth's primary Vespa dealership under owner Frank, so Italian scooters are very much our speciality."
    },
    {
        question: "Do you work on electric scooters?",
        answer: "Yes. We service electric mopeds, electric motorcycle-style scooters and stand-up electric scooters. We can help with everything from regular servicing to battery issues and electrical faults. Get in touch if you have a specific issue or question about your electric scooter."
    },
    {
        question: "Can you help if I have a flat tyre and can't transport my scooter?",
        answer: "Yes. We work closely with Perth Motorcycle and Scooter Movers to arrange affordable pickup and delivery if you can't ride your scooter in."
    },
    {
        question: "Do you fit scooter tyres?",
        answer: "Yes. We supply and fit, or fit-only, across all scooter tyre sizes — from 50cc scooters to maxi-scooters. See our tyre fitting page for more detail."
    }
];

const services = [
    {
        Icon: AlertCircle,
        title: 'No-Start Diagnosis & Service',
        description: "Your scooter won't fire up? We'll identify the root cause — electrical, fuel, or mechanical — and carry out all required work to get you back on the road.",
    },
    {
        Icon: Activity,
        title: 'Running Scooter Diagnosis & Service',
        description: 'Something feeling off, or just due for a service? We perform a thorough inspection and carry out any required maintenance or repairs to keep your scooter running at its best.',
    },
    {
        Icon: CircleDot,
        title: 'Tyre Fitting',
        description: 'Supply and fit, or fit-only. We handle tyre changes, replacements, and wheel balancing for all scooters — from 50cc to maxi-scooters.',
    },
];

const structuredData = [
    buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Servicing & Tyres', path: '/service' },
        { name: 'Scooter Repairs & Servicing', path: '/scooter-service' },
    ]),
    buildServiceSchema({
        serviceType: 'Scooter servicing and repairs',
        path: '/scooter-service',
        description: 'Expert scooter servicing, repairs, and tyre fitting in Perth. Vespa, Piaggio, Aprilia, Honda, Yamaha, and all major brands.',
        catalogName: 'Scooter Workshop Services',
        offers: services.map((s) => ({ name: s.title, description: s.description })),
    }),
    buildFaqSchema(scooterFaqs),
].filter(Boolean) as object[];

interface ScooterServicePageProps {
    initialUsedScooters: Bike[];
}

const ScooterServicePage = ({ initialUsedScooters }: ScooterServicePageProps) => {
    return (
        <div>
            <StructuredDataScript structuredData={structuredData} />

            <ServiceCTAV2
                headingLines={['Get Your', 'Scooter', 'Sorted.']}
                checkItems={scooterCheckItems}
            />

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
                    <p className="mt-8 text-center text-[var(--text-light-secondary)] text-lg">
                        Need tyres as part of the job? See our{' '}
                        <Link href="/tyre-fitting" className="text-highlight1 font-semibold underline underline-offset-4 hover:text-highlight1/80">
                            scooter tyre fitting
                        </Link>
                        {'. Also see our '}
                        <Link href="/service" className="text-highlight1 font-semibold underline underline-offset-4 hover:text-highlight1/80">
                            general workshop page
                        </Link>
                        .
                    </p>
                    <div className="text-center mt-10">
                        <Link href="/service-booking">
                            <Button className="bg-highlight1 hover:bg-highlight1/80 text-[var(--text-dark-primary)] font-bold px-8 py-5 text-lg inline-flex items-center gap-2">
                                Book Online <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <ServiceAreasSection
                headingLines={['Serving', 'Perth', 'Scooter Riders.']}
                vehicleType="scooter"
            />

            <MotorcycleMovers
                heading="Can't Ride Your Scooter In?"
                body="We work with and highly recommend Perth Motorcycle and Scooter Movers for all your transportation needs — whether you're bringing your scooter in for service, buying from us, or just need it moved."
                disclaimer="All bookings and fees are handled directly by Perth Motorcycle and Scooter Movers. They are a separate business — we do not take bookings or payments on their behalf."
            />

            {initialUsedScooters.length > 0 && (
                <FeaturedBikes
                    title="Thinking of Upgrading Your Scooter?"
                    bikes={initialUsedScooters}
                    description="Browse our current used scooters while your ride is in the workshop."
                    linkTo="/inventory/scooters/used"
                    linkText="View All Used Scooters"
                />
            )}

            <FaqSection title="Scooter Servicing FAQ" faqData={scooterFaqs} />

            <FloatingActionButton />
        </div>
    );
};

export default ScooterServicePage;

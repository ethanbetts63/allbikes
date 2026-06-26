import Link from 'next/link';
import StructuredDataScript from '@/components/StructuredDataScript';
import MotorcycleMovers from '@/components/MotorcycleMovers';
import { FaqSection } from '@/components/FaqSection';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Activity, CircleDot, ArrowRight, Award } from 'lucide-react';
import ServiceCTAV2 from '@/components/ServiceCTAV2';
import ServiceAreasSection from '@/components/ServiceAreasSection';
import { buildBreadcrumbSchema, buildServiceSchema, buildFaqSchema } from '@/lib/seo';

const vespaCheckItems = [
    'Vespa servicing & mechanical repairs',
    'All models — GTS, Sprint, Primavera, ET4, LX & more',
    'Tyre fitting & wheel balancing',
    'No-start diagnosis & electrical faults',
    '30+ years Vespa experience',
    "Can't ride it in? Pickup can be arranged",
];

const vespaFaqs = [
    {
        question: 'Do you specialise in Vespa scooters?',
        answer: "Yes. We've been working on Vespas for over 30 years — they're some of our favourite bikes to work on. We we're even Perth's only Vespa Dealership for a number of years.",
    },
    {
        question: 'Which Vespa models do you service?',
        answer: 'All of them. We service and repair the full Vespa range including the GTS, Sprint, Primavera, LX, ET4, and older two-stroke models. If you have a Vespa, we can help.',
    },
    {
        question: 'Do you stock Vespa parts?',
        answer: 'We carry commonly needed parts and have established supplier relationships for sourcing Vespa parts quickly.',
    },
    {
        question: "My Vespa won't start — can you fix it?",
        answer: 'Yes. No-start diagnosis is one of the most common jobs we handle. Whether the cause is electrical, fuel-related, or mechanical, we will track down the issue and carry out all required work to get you back on the road.',
    },
    {
        question: 'How long does a Vespa service take?',
        answer: 'A standard service is often completed same-day or next-day depending on our schedule. Involved repairs will take longer — we will give you an honest timeframe before work begins and keep you updated throughout.',
    },
    {
        question: 'Can you pick up my Vespa if I can\'t ride it in?',
        answer: 'Yes. We work closely with Perth Motorcycle and Scooter Movers to arrange affordable pickup and delivery if your Vespa is not rideable.',
    },
];

const services = [
    {
        Icon: AlertCircle,
        title: 'Vespa No-Start Diagnosis & Repair',
        description: "Vespa won't fire up? We'll identify the root cause — electrical fault, fuel system, or mechanical — and carry out everything your Vespa needs to get you riding again.",
    },
    {
        Icon: Activity,
        title: 'Vespa Servicing & Running Repairs',
        description: 'Routine Vespa service or something not quite right? We perform a thorough inspection and take care of whatever the bike needs to keep your Vespa running at its best.',
    },
    {
        Icon: CircleDot,
        title: 'Vespa Tyre Fitting',
        description: 'Supply and fit, or fit-only. We handle Vespa tyre changes and wheel balancing across all models.',
    },
];

const structuredData = [
    buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Servicing & Tyres', path: '/service' },
        { name: 'Vespa Service Perth', path: '/vespa-service-perth' },
    ]),
    buildServiceSchema({
        serviceType: 'Vespa servicing and repairs',
        path: '/vespa-service-perth',
        description: "Expert Vespa servicing and repairs in Perth. 30+ years hands-on Vespa experience. All models, all ages. Dianella workshop — book online.",
        catalogName: 'Vespa Workshop Services',
        offers: services.map((s) => ({ name: s.title, description: s.description })),
    }),
    buildFaqSchema(vespaFaqs),
].filter(Boolean) as object[];

const VespaServicePage = () => {
    return (
        <div>
            <StructuredDataScript structuredData={structuredData} />

            <ServiceCTAV2
                headingLines={['Get Your', 'Vespa', 'Sorted.']}
                checkItems={vespaCheckItems}
                subtitle="30+ years of hands-on Vespa experience. Perth's Vespa specialists, operating out of our Dianella workshop."
            />

            {/* Heritage callout */}
            <div className="bg-foreground py-14 px-4">
                <div className="container mx-auto max-w-3xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Award className="h-5 w-5 text-[var(--highlight)]" />
                        <p className="text-[var(--highlight)] text-xs font-bold uppercase tracking-[0.2em]">Perth's Vespa Specialists</p>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-[var(--text-light-primary)] leading-none mb-6">
                        30+ Years of Vespa Experience
                    </h2>
                    <p className="text-[var(--text-light-secondary)] text-lg leading-relaxed">
                        We were once Perth's only Vespa dealership, and that history runs deep. Decades of working exclusively on Vespas means we know every model inside out — from the older two-strokes through to the modern GTS and Primavera range. Vespas are genuinely some of our favourite bikes to work on. The build quality, the engineering heritage, and the way they ride makes them a pleasure to service and get right.
                    </p>
                </div>
            </div>

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
                        Also see our{' '}
                        <Link href="/scooter-service" className="text-highlight1 font-semibold underline underline-offset-4 hover:text-highlight1/80">
                            scooter repairs page
                        </Link>
                        {' '}or our{' '}
                        <Link href="/tyre-fitting" className="text-highlight1 font-semibold underline underline-offset-4 hover:text-highlight1/80">
                            tyre fitting page
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
                headingLines={['Serving', 'Perth', 'Vespa Riders.']}
                prose1="Our workshop is in Dianella, making it easy to get to from the northern suburbs and inner city. Vespa riders come to us from Morley, Yokine, Inglewood, Mount Lawley, North Perth, Northbridge, and the Perth CBD."
                prose2="We also see Vespas come in from Scarborough, Osborne Park, Subiaco, Fremantle, and Cottesloe. If you're looking for a Vespa mechanic in Perth, we're likely closer than you think."
            />

            <MotorcycleMovers
                heading="Can't Ride Your Vespa In?"
                body="We work with and highly recommend Perth Motorcycle and Scooter Movers for all your transportation needs — whether your Vespa isn't rideable or you just want it transported safely."
                disclaimer="All bookings and fees are handled directly by Perth Motorcycle and Scooter Movers. We do not take bookings or payments on their behalf."
            />

            <FaqSection title="Vespa Service FAQ" faqData={vespaFaqs} />

            <FloatingActionButton />
        </div>
    );
};

export default VespaServicePage;

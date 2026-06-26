import Link from 'next/link';
import StructuredDataScript from '@/components/StructuredDataScript';
import MotorcycleMovers from "@/components/MotorcycleMovers";
import { FaqSection } from "@/components/FaqSection";
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Activity, CircleDot, ArrowRight } from 'lucide-react';
import ServiceCTAV2 from '@/components/ServiceCTAV2';
import ServiceAreasSection from '@/components/ServiceAreasSection';
import ReviewCarousel from '@/components/ReviewCarousel';
import { buildBreadcrumbSchema, buildServiceSchema, buildFaqSchema } from '@/lib/seo';

const ServiceFaqs = [
  {
    question: "Do you repair scooters and motorcycles?",
    answer: "Yes. We carry out scooter repairs and motorcycle repairs across all makes and models — from no-start diagnosis and electrical faults to mechanical repairs, full servicing, and tyre fitting. Our workshop is in Dianella and we serve riders across Perth."
  },
  {
    question: "What scooter brands do you service?",
    answer: "We service all scooter brands. We have a long history with Italian brands — Vespa, Piaggio, and Aprilia — and regularly work on Honda, Yamaha, SYM, Kymco, TGB, Bolwell, and all other major brands. If you're unsure whether we work on your specific model, get in touch."
  },
  {
    question: "Do you service electric scooters?",
    answer: "Yes. We service electric mopeds and electric motorcycle-style scooters, including regular servicing, battery-related issues, and electrical faults. Get in touch if you have a specific question about your electric scooter."
  },
  {
    question: "My scooter won't start — can you help?",
    answer: "Yes. No-start diagnosis is a core part of what we do. Whether the cause is electrical, fuel-related, or mechanical, we'll identify the problem and carry out the required work to get you back on the road."
  },
  {
    question: "How long does a scooter or motorcycle repair take?",
    answer: "It depends on the work required. We'll assess your bike and give you an honest timeframe before any work begins. Simple repairs and services are often completed same-day. We'll keep you updated throughout."
  },
  {
    question: "Do you service Vespa scooters?",
    answer: "Yes — Vespas are something of a speciality. We were Perth's primary Vespa dealer for years before we moved to focusing on servicing, so we have over 30 years of hands-on Vespa experience. Not only are we the best at working on them, they are also a pleasure to work on. We service and repair all Vespa models."
  },
  {
    question: "Can you pick up my bike if I can't ride it in?",
    answer: "Yes. We work closely with Perth Motorcycle and Scooter Movers to arrange affordable pickup and delivery if you can't ride your bike in. All bookings and fees are handled directly with them."
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

const structuredData = [
  buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Servicing & Tyres', path: '/service' },
  ]),
  buildServiceSchema({
    serviceType: 'Motorcycle and scooter servicing and repairs',
    path: '/service',
    description: 'Expert motorcycle and scooter servicing, repairs, and tyre fitting in Perth.',
    catalogName: 'Workshop Services',
    offers: services.map((s) => ({ name: s.title, description: s.description })),
  }),
  buildFaqSchema(ServiceFaqs),
].filter(Boolean) as object[];

const ServicePage = () => {
    return (
        <div>
            <StructuredDataScript structuredData={structuredData} />

            <ServiceCTAV2 subtitle="Expert scooter repairs and servicing in Perth. Our experienced mechanics have been keeping local riders on the road for decades — book your service online in minutes." />

            <ReviewCarousel />

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
                            motorcycle and scooter tyre fitting
                        </Link>
                        . Looking for your next ride? Browse our{' '}
                        <Link href="/inventory/motorcycles/used" className="text-highlight1 font-semibold underline underline-offset-4 hover:text-highlight1/80">
                            used motorcycles
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

            <ServiceAreasSection />

            {/* Motorcycle Movers */}
            <MotorcycleMovers />

            <FaqSection title="Workshop FAQ" faqData={ServiceFaqs} />

            <FloatingActionButton />
        </div>
    );
};

export default ServicePage;

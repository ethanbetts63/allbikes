import Link from 'next/link';
import StructuredDataScript from '@/components/StructuredDataScript';
import MotorcycleMovers from "@/components/MotorcycleMovers";
import { FaqSection } from "@/components/FaqSection";
import { Button } from '@/components/ui/button';
import { CircleDot, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';
import ServiceBookingHero from '@/components/ServiceBookingHero';
import ServiceAreasSection from '@/components/ServiceAreasSection';
import ReviewCarousel from '@/components/ReviewCarousel';
import type { Review } from '@/types/Review';
import { buildBreadcrumbSchema, buildServiceSchema, buildFaqSchema } from '@/lib/seo';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Fast Motorcycle & Moped Tyre Fitting Perth',
  description: '(08) 9433 4613. Motorcycle tyre changes, scooter tyre replacement, puncture repairs, and flat tyre repairs in Perth, with supply-and-fit or fit-only options.',
  canonicalPath: '/tyre-fitting',
});

const tyreReviews: Review[] = [
  {
    pk: 501,
    author_name: 'Gilbert Flynn',
    text: 'After picking up a nail I needed a new tyre; and I was assisted from beginning to end, including advice as to how to get the Vespa there without needing transport, to a prompt replacement, a convenient pick-up, and further advice on ongoing maintenance. An excellent experience and recommended - plus unlike many specialist scooter service centres, it is located close to the city.',
    date: '',
    display_order: 0,
  },
  {
    pk: 502,
    author_name: 'Tim Fraser',
    text: "Frank is an excellent scooter technician, and I have a freshly sorted px200 to prove it!\n\nI came in needing new tyres and left with a seemingly unsolvable electrical problem solved. Actually, Frank found that there were three problems. Kinda five, really.\n\nWhat's more, he is a really top bloke.\n\nThank you Frank.",
    date: '',
    display_order: 1,
  },
  {
    pk: 503,
    author_name: 'Szy and Nina Lance',
    text: 'We bought a scooter from here a few years ago, dropped it off with a service related issue. He was quick to fit me in, and had it running as good as the day we picked it up. Freshly serviced and very well priced for the work he had carried out.\nWell worth the travel time for us, especially after no-one local to me wanted to tackle it.',
    date: '',
    display_order: 2,
  },
  {
    pk: 504,
    author_name: 'Michael Ryan',
    text: 'I recently had my Scooter serviced at the Scooter Shop. I was treated like a VIP from the time that I booked my scooter in to the time I was handed back the keys. The details of the service were explained to me in full. If you want someone you can trust to service your scooter, then take it to the Scooter Shop. You will not be disappointed.',
    date: '',
    display_order: 3,
  }
];

const TyreFittingFaqs = [
  {
    question: "Do you offer motorcycle and scooter tyre fitting?",
    answer: "Yes. We specialise in motorcycle and scooter tyre fitting, including motorcycle tyre change, scooter tyre change, tyre supply and fit, and fit-only jobs where you supply the tyres. We handle everything from 50cc scooter tyres through to large-capacity motorcycle tyres."
  },
  {
    question: "Do you fit tyres on Vespa and Piaggio scooters?",
    answer: "Yes. We have extensive experience with scooter tyre replacement and tyre fitting on Vespa and Piaggio models, including puncture repair and flat tyre repair. Owner Frank previously operated Perth's primary Vespa dealership, so these bikes are well known to us."
  },
  {
    question: "Do you do tyre changes on 50cc scooters?",
    answer: "Yes. We perform scooter tyre replacement and tyre install on 50cc scooters as well as larger-capacity scooters. Puncture repair and flat tyre repair are also available for smaller-capacity bikes."
  },
  {
    question: "Do you fit tyres on dirt bikes?",
    answer: "Yes. We offer motorcycle tyre replacement and tyre fitting for dirt bikes, including flat tyre repair and puncture repair. If you're unsure whether your specific bike is suitable, feel free to get in touch."
  },
  {
    question: "Do you work on electric scooter tyres?",
    answer: "Yes. We provide tyre fitting and tyre repair for electric scooters and electric motorcycle-style scooters. We do not work on electric kick scooter tyres — these are a different vehicle entirely."
  },
  {
    question: "Can you supply tyres, or do I need to bring my own?",
    answer: "Both. We offer tyre supply and fit, where we source and install motorcycle tyres or scooter tyres for you. Alternatively, if you have already sourced your own tyres, we can carry out a fit-only tyre install. Wheel balancing is included as standard either way."
  },
  {
    question: "Can you help if I have a flat tyre and can't transport my bike?",
    answer: "Yes. If you're dealing with a flat tyre or puncture and can't ride your bike in, we work closely with Perth Motorcycle and Scooter Movers to arrange affordable pickup and delivery to and from our workshop."
  }
];

const tyreServices = [
  {
    Icon: CircleDot,
    title: 'Motorcycle & Scooter Tyre Change',
    description: 'We carry out motorcycle tyre replacement and scooter tyre replacement for all makes and models — from 50cc scooters through to large-capacity motorcycles. Supply and fit, or fit-only.',
  },
  {
    Icon: Wrench,
    title: 'Puncture Repair & Flat Tire Repair',
    description: 'Flat tire repair and puncture repair carried out in our Dianella workshop. If you can\'t ride the bike in, we can arrange pickup through our movers contact.',
  },
  {
    Icon: CheckCircle2,
    title: 'Tyre Supply, Install & Balancing',
    description: 'We supply motorcycle tyres and scooter tyres across a range of brands, or you can bring your own for a tyre install. Wheel balancing is included as standard with every fitting.',
  },
];

const structuredData = [
  buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Tyre Fitting', path: '/tyre-fitting' },
  ]),
  buildServiceSchema({
    serviceType: 'Motorcycle and scooter tyre fitting',
    path: '/tyre-fitting',
    description:
      'Motorcycle tyre change, scooter tyre replacement, puncture repair, flat tyre repair, and tyre supply and fit in Perth.',
    catalogName: 'Tyre Fitting Services',
    offers: tyreServices.map((s) => ({ name: s.title, description: s.description })),
  }),
  buildFaqSchema(TyreFittingFaqs),
].filter(Boolean) as object[];

const TyreFittingPage = () => {
    return (
        <div>
            <StructuredDataScript structuredData={structuredData} />

            <ServiceBookingHero
                headingLines={['Fast Motorcycle', '& Moped', 'Tyre Fitting']}
                subtitle="Motorcycle and moped tyre fitting and puncture repair, done at our Dianella workshop. Supply and fit, or bring your own tyres."
                checkItems={[
                    'Motorcycle/motorbike tire fitting — supply and fit, or fit-only',
                    'Scooter & moped tyre fitting near Perth',
                    'Tire change & wheel balancing',
                    'Puncture repair & flat tire repair',
                    'Motorcycle tyre replacement — all makes & sizes',
                    'Scooter tyre replacement — Vespa, Piaggio & more',
                ]}
                defaultJobTypeName="Tyre Fitting"
            />

            <ReviewCarousel reviews={tyreReviews} />

            {/* Tyre Services */}
            <div className="bg-background pt-8 pb-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-[var(--text-light-primary)] mb-12">Tyre Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tyreServices.map(({ Icon, title, description }) => (
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
                        Ready to organise a tire change, puncture repair, or wheel balancing?{' '}
                        <Link href="#book" className="text-highlight1 font-semibold underline underline-offset-4 hover:text-highlight1/80">
                            Book online
                        </Link>
                        {' '}and we&apos;ll confirm the job with you.
                    </p>
                    <div className="text-center mt-10">
                        <Link href="#book">
                            <Button className="bg-highlight1 text-[var(--text-light-primary)] font-bold px-8 py-5 text-lg hover:bg-highlight1/90 inline-flex items-center gap-2">
                                Book Online <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <ServiceAreasSection />

            {/* Motorcycle Movers */}
            <MotorcycleMovers />

            <FaqSection title="Motorcycle Tyre Fitting FAQ" faqData={TyreFittingFaqs} />
        </div>
    );
};

export default TyreFittingPage;

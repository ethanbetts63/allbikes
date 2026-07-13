import { CheckCircle2 } from 'lucide-react';
import BookingStarterCard from '@/components/BookingStarterCard';

const defaultCheckItems = [
    'Full mechanical servicing & repairs',
    'Tyre fitting & wheel balancing',
    'Vespa, Piaggio & all major brands',
    'Electric motorcycle & scooter servicing',
    "Can't move your bike? Pickup can be arranged",
];

interface ServiceBookingHeroProps {
    headingLines?: string[];
    checkItems?: string[];
    subtitle?: string;
    defaultJobTypeName?: string;
}

const ServiceBookingHero = ({
    headingLines = ['Get Your', 'Bike', 'Sorted.'],
    checkItems = defaultCheckItems,
    subtitle = "Our experienced mechanics have been keeping Perth riders on the road for decades. Book your service online in minutes.",
    defaultJobTypeName,
}: ServiceBookingHeroProps) => {
    return (
        <section id="book" className="bg-[var(--bg-dark-primary)] py-12 lg:py-20 px-4 scroll-mt-20">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

                    {/* Left — bold typographic block */}
                    <div className="lg:sticky lg:top-24">
                        <p className="text-[var(--highlight)] text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            ScooterShop · Perth
                        </p>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[var(--text-light-primary)] leading-none mb-6 uppercase italic">
                            {headingLines.map((line, i) => (
                                <span key={i}>{line}{i < headingLines.length - 1 && <br />}</span>
                            ))}
                        </h1>
                        <p className="text-[var(--text-light-secondary)] text-lg leading-relaxed max-w-sm mb-10">
                            {subtitle}
                        </p>
                        <ul className="space-y-4">
                            {checkItems.map((item) => (
                                <li key={item} className="flex items-start gap-4">
                                    <CheckCircle2 className="h-5 w-5 text-[var(--highlight)] mt-0.5 shrink-0" />
                                    <span className="text-[var(--text-light-secondary)] text-lg leading-snug">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right — step 1 of the booking flow */}
                    <BookingStarterCard defaultJobTypeName={defaultJobTypeName} />

                </div>
            </div>
        </section>
    );
};

export default ServiceBookingHero;

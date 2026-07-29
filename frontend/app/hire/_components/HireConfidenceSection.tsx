import type React from 'react';
import { ShieldCheck, MapPin, XCircle, Wrench, Tag } from 'lucide-react';

interface Props {
    weeklyDiscountPercent: number | null;
    monthlyDiscountPercent: number | null;
}

const HireConfidenceSection = ({ weeklyDiscountPercent, monthlyDiscountPercent }: Props) => {
    const weeklyLabel = weeklyDiscountPercent ? `${weeklyDiscountPercent}% off` : null;
    const monthlyLabel = monthlyDiscountPercent ? `${monthlyDiscountPercent}% off` : null;

    const usps = [
        weeklyLabel && {
            icon: Tag,
            title: 'Weekly Discount',
            description: `${weeklyLabel} for 7+ day bookings. Applied automatically.`,
        },
        monthlyLabel && {
            icon: Tag,
            title: 'Monthly Discount',
            description: `${monthlyLabel} for 30+ day bookings. Best value.`,
        },
        { icon: ShieldCheck, title: 'Refundable Bond', description: 'Collected in-store at pickup, refunded in full on return.' },
        { icon: MapPin, title: 'Easy Pickup', description: 'Collect and return at our Dianella workshop.' },
        { icon: XCircle, title: 'Free Cancellation', description: 'Cancel free up to 5 days before pickup.' },
        { icon: Wrench, title: 'Roadside Assist', description: '7am–9pm courtesy assistance. Subject to availability.' },
    ].filter(Boolean) as { icon: React.ElementType; title: string; description: string }[];

    const cols = usps.length <= 4 ? 'lg:grid-cols-4' : usps.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-6';

    return (
        <section className="bg-[var(--bg-dark-primary)] py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
                        Why Hire From Us
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-[var(--text-light-primary)] leading-none">
                        Hire With Confidence
                    </h2>
                </div>
                <div className={`grid grid-cols-2 sm:grid-cols-3 ${cols} gap-6`}>
                    {usps.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="flex flex-col items-center text-center gap-3">
                            <div className="bg-[var(--bg-dark-secondary)] p-3 rounded-lg">
                                <Icon className="h-5 w-5 text-[var(--highlight)]" />
                            </div>
                            <p className="text-[var(--text-light-primary)] font-bold text-sm uppercase tracking-wide leading-tight">
                                {title}
                            </p>
                            <p className="text-[var(--text-light-secondary)] text-xs leading-relaxed">
                                {description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HireConfidenceSection;

import { ShieldCheck, Clock, Bike, MapPin } from 'lucide-react';

const usps = [
    { icon: Clock, title: 'Flexible Durations', description: 'Daily, weekly, and monthly rates available. Only pay for the time you need.' },
    { icon: ShieldCheck, title: 'Refundable Bond', description: 'A bond is held at time of payment and refunded in full when the bike is returned in good condition.' },
    { icon: Bike, title: 'Maintained Fleet', description: 'Every bike in our hire fleet is serviced and maintained by our in-house workshop team.' },
    { icon: MapPin, title: 'Easy Pickup', description: 'Collect and return from our workshop in Dianella — Unit 5 / 6 Cleveland Street.' },
];

const HireConfidenceSection = () => (
    <section className="bg-[var(--bg-dark-primary)] py-16 px-6">
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
                <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
                    Why Hire From Us
                </p>
                <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-[var(--text-light-primary)] leading-none">
                    Hire With Confidence
                </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

export default HireConfidenceSection;

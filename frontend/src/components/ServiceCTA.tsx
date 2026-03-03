import { Link } from 'react-router-dom';
import { Wrench, Settings, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const services = [
    {
        icon: Wrench,
        title: 'Servicing & Repairs',
        description:
            'Full mechanical servicing for motorcycles and scooters of all makes — from routine maintenance to complex repairs.',
    },
    {
        icon: Settings,
        title: 'Tyre Fitting',
        description:
            'Supply and fit, or fit your own tyres. Includes wheel balancing and puncture repair on all motorcycle and scooter types.',
    },
    {
        icon: CalendarCheck,
        title: 'Easy Online Booking',
        description:
            'Book your service or tyre fitting online in minutes. Choose a time that suits you and we\'ll handle the rest.',
    },
];

const ServiceCTA = () => {
    return (
        <section className="bg-zinc-900 py-16 px-4">
            <div className="container mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">
                        Perth Workshop
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Expert Motorcycle & Scooter Services
                    </h2>
                    <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
                        From routine servicing to tyre changes, our experienced mechanics keep your bike running at its best.
                    </p>
                </div>

                {/* Service cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {services.map(({ icon: Icon, title, description }) => (
                        <div
                            key={title}
                            className="border border-zinc-700 rounded-xl p-6 bg-zinc-800/50 hover:border-green-400 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <div className="w-12 h-12 rounded-lg bg-green-400/10 flex items-center justify-center mb-4">
                                <Icon className="h-6 w-6 text-green-400" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link to="/booking">
                        <Button
                            size="lg"
                            className="bg-green-400 hover:bg-green-300 text-zinc-900 font-bold px-10 text-base"
                        >
                            Book a Service
                        </Button>
                    </Link>
                    <p className="text-zinc-500 text-sm mt-3">Takes less than 2 minutes to book online</p>
                </div>
            </div>
        </section>
    );
};

export default ServiceCTA;

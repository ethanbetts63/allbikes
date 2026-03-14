import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const checkItems = [
    'Full mechanical servicing & repairs',
    'Tyre fitting & wheel balancing',
    'Puncture & flat tyre repair',
    'Vespa, Piaggio & all major brands',
    'Electric motorcycle & scooter servicing',
    "Can't move your bike? Pickup can be arranged",
];

const ServiceCTAV2 = () => {
    return (
        <section className="bg-stone-900 py-20 px-4">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left — bold typographic block */}
                    <div>
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            Allbikes Workshop · Perth
                        </p>
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-none mb-6 uppercase italic">
                            Get Your<br />Bike<br />Sorted.
                        </h2>
                        <p className="text-stone-400 text-lg leading-relaxed max-w-sm mb-10">
                            Our experienced mechanics have been keeping Perth riders on the road for decades. Book your service online in minutes.
                        </p>
                        <Link to="/booking">
                            <Button
                                size="lg"
                                className="bg-amber-400 hover:bg-amber-300 text-[var(--text-dark-primary)] font-bold px-8 text-base group"
                            >
                                Book Online
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>

                    {/* Right — service checklist */}
                    <div className="lg:border-l lg:border-stone-700 lg:pl-16">
                        <p className="text-[var(--text-dark-secondary)] text-xs font-bold uppercase tracking-widest mb-8">
                            What we do
                        </p>
                        <ul className="space-y-5">
                            {checkItems.map((item) => (
                                <li key={item} className="flex items-start gap-4">
                                    <CheckCircle2 className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                                    <span className="text-stone-200 text-lg leading-snug">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ServiceCTAV2;

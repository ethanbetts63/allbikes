import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import moverImage from '@/assets/movers.webp';

const MotorcycleMovers = () => {
    return (
        <div className="bg-foreground overflow-hidden grid grid-cols-1 md:grid-cols-2">

            {/* Image */}
            <div className="relative min-h-[240px] md:min-h-0">
                <img
                    src={moverImage}
                    alt="Motorcycle on a transport ramp"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 flex flex-col justify-center gap-5">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-light-primary)] mb-3">
                        Can't Ride Your Bike In?
                    </h2>
                    <p className="text-[var(--text-light-secondary)] text-lg leading-relaxed">
                        We work with and highly recommend Perth Motorcycle and Scooter Movers for
                        all your transportation needs — whether you're bringing a bike in for service,
                        buying from us, or just need it moved.
                    </p>
                </div>
                <p className="text-sm text-[var(--text-light-secondary)] border-t border-stone-700 pt-4">
                    All bookings and fees are handled directly by Perth Motorcycle and Scooter Movers.
                    They are a separate business — we do not take bookings or payments on their behalf.
                </p>
                <a
                    href="https://perthmotorcyclescootermovers.com.au/"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="self-start"
                >
                    <Button className="bg-highlight1 hover:bg-highlight1/80 text-[var(--text-light-primary)] font-bold px-6 py-3 text-base flex items-center gap-2">
                        Visit Their Website
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </a>
            </div>

        </div>
    );
};

export default MotorcycleMovers;

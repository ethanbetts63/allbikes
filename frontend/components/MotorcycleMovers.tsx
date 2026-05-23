import NextImage from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import moverImage from '@/assets/movers.webp';

interface MotorcycleMoversProps {
    heading?: string;
    body?: string;
    disclaimer?: string;
}

const MotorcycleMovers = ({
    heading = "Can't Ride Your Bike In?",
    body = "We work with and highly recommend Perth Motorcycle and Scooter Movers for all your transportation needs — whether you're bringing a bike in for service, buying from us, or just need it moved.",
    disclaimer = "All bookings and fees are handled directly by Perth Motorcycle and Scooter Movers. They are a separate business — we do not take bookings or payments on their behalf.",
}: MotorcycleMoversProps) => {
    return (
        <div className="bg-foreground overflow-hidden grid grid-cols-1 md:grid-cols-2">

            {/* Image */}
            <div className="relative min-h-[240px] md:min-h-0">
                <NextImage
                    src={moverImage}
                    alt="Motorcycle on a transport ramp"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                />
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 flex flex-col justify-center gap-5">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-light-primary)] mb-3">
                        {heading}
                    </h2>
                    <p className="text-[var(--text-light-secondary)] text-lg leading-relaxed">
                        {body}
                    </p>
                </div>
                <p className="text-sm text-[var(--text-light-secondary)] border-t border-stone-700 pt-4">
                    {disclaimer}
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

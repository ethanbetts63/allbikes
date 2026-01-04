import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import moverImage from '@/assets/movers.webp';

const MotorcycleMovers: React.FC = () => {
    return (
        <div className="bg-foreground text-[var(--text-primary)] rounded-lg overflow-hidden md:flex mt-2 mb-4">
            {/* Left Column: Image */}
            <div className="md:w-1/3">
                <img 
                    src={moverImage} 
                    alt="Motorcycle on a transport ramp" 
                    className="w-full h-auto md:h-full object-cover"
                />
            </div>

            {/* Right Column: Title, Text, and Button */}
            <div className="p-8 md:w-2/3 flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-4">Need your bike dropped off or picked up?</h2>
                <p className="text-lg text-[var(--text-secondary)]">
                    We work with and highly recommend Perth Motorcycle and Scooter Movers for all your transportation needs. Whether you're buying a new scooter from us, need a service, or just moving your bike, they offer reliable and professional service.
                </p>
                <p className="text-sm italic text-[var(--text-secondary)] mt-4">
                    Please note: All bookings and fees are handled directly by Perth Motorcycle and Scooter Movers, as they are a separate entity. We do not facilitate bookings or payments on their behalf.
                </p>
                <a 
                    href="https://perthmotorcyclescootermovers.com.au/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-6 inline-block"
                >
                    <Button className="bg-primary text-[var(--text-primary)] font-bold px-8 py-5 text-xl hover:bg-primary/90 flex items-center gap-2">
                        Book with Movers <ArrowRight className="h-5" />
                    </Button>
                </a>
            </div>
        </div>
    );
};

export default MotorcycleMovers;
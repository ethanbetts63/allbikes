import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MotorcycleMovers from '@/components/MotorcycleMovers';
import { CheckCircle } from 'lucide-react';
import Seo from '@/components/Seo';

const BookingSuccessPage: React.FC = () => {
    return (
        <div className="container mx-auto py-10 max-w-4xl text-center">
            <Seo
                title="Booking Successful | Allbikes Perth"
                description="Your service booking has been submitted successfully. We will contact you shortly to confirm."
                noindex={true}
            />
            <div className="p-8 border rounded-lg shadow-lg bg-card text-black]">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h1 className="text-3xl font-bold mb-4">Booking Submitted Successfully!</h1>
                <p className="text-lg text-[var(--text-black)] mb-8">
                    Thank you! We have received your booking request and will be in touch shortly to confirm the details.
                </p>
                <Link to="/">
                    <Button>Back to Home</Button>
                </Link>
            </div>
            
            <div className="mt-12">
                <MotorcycleMovers />
            </div>
        </div>
    );
};

export default BookingSuccessPage;

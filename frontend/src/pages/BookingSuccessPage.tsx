import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Seo from '@/components/Seo';
import MotorcycleMovers from '@/components/MotorcycleMovers';

const BookingSuccessPage = () => {
    return (
        <>
            <Seo
                title="Booking Submitted | ScooterShop Perth"
                description="Your service booking has been submitted successfully. We will contact you shortly to confirm."
                noindex={true}
            />
            <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
                <div className="container mx-auto px-4 py-12 max-w-2xl">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <CheckCircle className="h-16 w-16 text-highlight1 mx-auto mb-4" />
                        <h1 className="text-3xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
                            Request Submitted
                        </h1>
                        <p className="text-[var(--text-dark-secondary)] text-sm">
                            We've received your booking request and will be in touch shortly to confirm the details.
                        </p>
                    </div>

                    {/* Detail block */}
                    <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg divide-y divide-stone-100 mb-8">
                        <div className="p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">What's Next</p>
                            <p className="text-sm text-[var(--text-dark-secondary)]">
                                Our team will review your request and contact you to confirm your drop-off time and provide a quote if needed.
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Questions?</p>
                            <p className="text-sm text-[var(--text-dark-secondary)]">
                                Call us or send an email and we'll be happy to help.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/"
                        className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
                    >
                        ← Back to Home
                    </Link>

                </div>

                <div className="container mx-auto px-4 pb-12 max-w-4xl">
                    <MotorcycleMovers />
                </div>
            </div>
        </>
    );
};

export default BookingSuccessPage;

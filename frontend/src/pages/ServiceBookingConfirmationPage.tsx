import { useLocation, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Seo from '@/components/Seo';
import MotorcycleMovers from '@/components/MotorcycleMovers';

interface ConfirmationState {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    make: string;
    model: string;
    year?: string;
    registration_number: string;
    drop_off_time: string;
    job_type_names: string[];
    note?: string;
}

const BookingConfirmationPage = () => {
    const location = useLocation();
    const state = location.state as ConfirmationState | null;

    return (
        <>
            <Seo
                title="Service Request Submitted | ScooterShop Perth"
                description="Your service request has been submitted. We'll be in touch shortly to confirm."
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
                            We've received your service request and will be in touch shortly to confirm your booking.
                        </p>
                    </div>

                    {state ? (
                        <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg divide-y divide-stone-100 mb-8">

                            <div className="p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Your Details</p>
                                <p className="text-sm text-[var(--text-dark-primary)] font-semibold">{state.first_name} {state.last_name}</p>
                                <p className="text-sm text-[var(--text-dark-secondary)]">{state.email}</p>
                                <p className="text-sm text-[var(--text-dark-secondary)]">{state.phone}</p>
                            </div>

                            <div className="p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Motorcycle</p>
                                <p className="text-sm text-[var(--text-dark-primary)] font-semibold">
                                    {[state.year, state.make, state.model].filter(Boolean).join(' ')}
                                </p>
                                <p className="text-sm text-[var(--text-dark-secondary)]">Rego: {state.registration_number}</p>
                            </div>

                            <div className="p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Requested Drop-off</p>
                                <p className="text-sm text-[var(--text-dark-primary)]">{state.drop_off_time}</p>
                            </div>

                            <div className="p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Services Requested</p>
                                <ul className="space-y-1">
                                    {state.job_type_names.map(job => (
                                        <li key={job} className="text-sm text-[var(--text-dark-primary)]">{job}</li>
                                    ))}
                                </ul>
                            </div>

                            {state.note && (
                                <div className="p-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Notes</p>
                                    <p className="text-sm text-[var(--text-dark-secondary)] whitespace-pre-line">{state.note}</p>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg p-4 mb-8">
                            <p className="text-sm text-[var(--text-dark-secondary)]">
                                Our team will review your request and be in touch shortly to confirm your drop-off time.
                            </p>
                        </div>
                    )}

                    <Link
                        to="/"
                        className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
                    >
                        ← Back to Home
                    </Link>

                </div>

                <MotorcycleMovers />
            </div>
        </>
    );
};

export default BookingConfirmationPage;

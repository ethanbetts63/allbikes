"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { createBooking } from '@/services/bookingService';
import BikeDetailsForm from '@/forms/ServiceBikeDetailsForm';
import PersonalDetailsForm from '@/forms/ServicePersonalDetailsForm';
import {
    BOOKING_PROGRESS_STORAGE_KEY,
    hasStep1Data,
    useBookingProgress,
} from '@/lib/serviceBookingProgress';

const CONFIRMATION_STORAGE_KEY = 'serviceBookingConfirmation';

// Step 1 (Booking Details) lives on /service. This page handles steps 2–3.
const STEPS = ['Booking Details', 'Bike Details', 'Your Details'];

const BookingPage = () => {
    const [step, setStep] = useState(2);
    const router = useRouter();
    const { formData, setFormData, hydrated } = useBookingProgress();

    // Guard: without step-1 data there is nothing to continue — send the user to /service.
    // Steps 2–3 never edit the step-1 fields, so this stays satisfied while filling them in.
    const canContinue = hydrated && hasStep1Data(formData);
    useEffect(() => {
        if (hydrated && !canContinue) {
            router.replace('/service');
        }
    }, [hydrated, canContinue, router]);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await createBooking(formData);
            sessionStorage.setItem(CONFIRMATION_STORAGE_KEY, JSON.stringify(formData));
            localStorage.removeItem(BOOKING_PROGRESS_STORAGE_KEY);
            router.push('/service-booking/confirmation');
        } catch (error) {
            console.error("Booking submission error:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "There was an error submitting your booking. Please try again."
            );
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 2:
                return <BikeDetailsForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={() => router.push('/service#book')} />;
            case 3:
                return <PersonalDetailsForm formData={formData} setFormData={setFormData} prevStep={prevStep} handleSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
                <div className="container mx-auto px-4 py-8 max-w-2xl">

                    <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
                        Request a Service
                    </h1>

                    {/* Step indicator — step 1 is completed on /service and links back for edits */}
                    <div className="flex items-center gap-2 mb-8">
                        {STEPS.map((label, i) => {
                            const n = i + 1;
                            const active = n === step;
                            const done = n < step;
                            const indicator = (
                                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${active ? 'text-[var(--text-dark-primary)]' : done ? 'text-highlight' : 'text-[var(--text-dark-secondary)]'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${active ? 'bg-[var(--text-dark-primary)] text-[var(--bg-light-primary)]' : done ? 'bg-highlight text-[var(--text-dark-primary)]' : 'bg-[var(--border-light)] text-[var(--text-dark-secondary)]'}`}>
                                        {done ? <Check className="h-3 w-3" /> : n}
                                    </span>
                                    <span className="hidden sm:inline">{label}</span>
                                </div>
                            );
                            return (
                                <div key={n} className="flex items-center gap-2">
                                    {n === 1 ? (
                                        <Link href="/service#book" title="Edit booking details" className="hover:opacity-80 transition-opacity">
                                            {indicator}
                                        </Link>
                                    ) : indicator}
                                    {i < STEPS.length - 1 && (
                                        <span className="text-[var(--border-light)] text-xs">—</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {canContinue && renderStep()}

                </div>
            </div>
        </>
    );
};

export default BookingPage;

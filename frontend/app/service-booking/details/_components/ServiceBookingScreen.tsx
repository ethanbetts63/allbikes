'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { createBooking } from '@/services/bookingService';
import BikeDetailsForm from '@/forms/ServiceBikeDetailsForm';
import PersonalDetailsForm from '@/forms/ServicePersonalDetailsForm';
import {
  BOOKING_PROGRESS_STORAGE_KEY,
  hasStep1Data,
  useBookingProgress,
} from '@/lib/serviceBookingProgress';
import BookingStepIndicator from './BookingStepIndicator';

const CONFIRMATION_STORAGE_KEY = 'serviceBookingConfirmation';

export default function ServiceBookingScreen() {
  const [step, setStep] = useState(2);
  const router = useRouter();
  const { formData, setFormData, hydrated } = useBookingProgress();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guard: without step-1 data there is nothing to continue — send the user to /service.
  // Steps 2–3 never edit the step-1 fields, so this stays satisfied while filling them in.
  const canContinue = hydrated && hasStep1Data(formData);
  useEffect(() => {
    if (hydrated && !canContinue) router.replace('/service');
  }, [hydrated, canContinue, router]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createBooking(formData);
      sessionStorage.setItem(CONFIRMATION_STORAGE_KEY, JSON.stringify(formData));
      localStorage.removeItem(BOOKING_PROGRESS_STORAGE_KEY);
      router.push('/service-booking/confirmation');
    } catch (err) {
      console.error('Booking submission error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'There was an error submitting your booking. Please try again.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
          Request a Service
        </h1>

        <BookingStepIndicator step={step} />

        {canContinue && step === 2 && (
          <BikeDetailsForm
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={() => router.push('/service#book')}
          />
        )}
        {canContinue && step === 3 && (
          <PersonalDetailsForm
            formData={formData}
            setFormData={setFormData}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

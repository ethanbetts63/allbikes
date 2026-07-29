'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';

import type { HireBookingSummary } from '@/app/hire/book/[bookingReference]/payment/_lib/HireBookingSummary';
import { createHirePaymentIntent, getHireBookingByReference } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import { stripePromise } from '@/lib/stripe';
import HirePaymentSummary from './HirePaymentSummary';
import { buildSummaryFromBooking } from '../_lib/hirePayment';
import { getHireBookingToken } from '@/app/hire/book/_lib/hireBookingAccess';

export default function HirePaymentScreen() {
  const router = useRouter();
  const params = useParams<{ bookingReference: string }>();
  const bookingReference = params.bookingReference;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [summary, setSummary] = useState<HireBookingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!bookingReference) {
      router.push('/hire');
      return;
    }

    let cancelled = false;
    const loadPayment = async () => {
      try {
        const token = getHireBookingToken(bookingReference);
        if (!token) throw new Error('The secure booking session has expired.');
        const booking = await getHireBookingByReference(bookingReference, token);
        const paymentIntent = await createHirePaymentIntent(bookingReference, token);
        if (cancelled) return;
        setClientSecret(paymentIntent.clientSecret);
        setSummary(buildSummaryFromBooking(booking));
      } catch (err) {
        console.error('Failed to prepare hire payment:', err);
        if (!cancelled) setLoadError('Unable to prepare payment. Please go back and try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPayment();
    return () => { cancelled = true; };
  }, [bookingReference, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (loadError || !clientSecret || !bookingReference) {
    return (
      <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <p className="text-destructive text-sm mb-4">{loadError || 'Payment could not be loaded.'}</p>
          <button
            type="button"
            onClick={() => router.push('/hire')}
            className="py-3 px-6 rounded-lg font-bold uppercase tracking-widest text-sm bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] transition-colors"
          >
            Back to Hire
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {summary && <HirePaymentSummary summary={summary} />}

        <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
          Payment
        </h1>
        <p className="text-sm text-[var(--text-dark-secondary)] mb-6">
          Booking reference:{' '}
          <span className="font-mono font-semibold text-[var(--text-dark-primary)]">{bookingReference}</span>
        </p>

        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <StripePaymentForm
            returnUrl={`${window.location.origin}/hire/processing?ref=${bookingReference}`}
            onSucceeded={() => router.push(`/hire/processing?ref=${bookingReference}`)}
          />
        </Elements>
      </div>
    </div>
  );
}

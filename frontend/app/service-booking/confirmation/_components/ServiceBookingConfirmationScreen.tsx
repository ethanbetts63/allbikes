'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

import MotorcycleMovers from '@/components/service/MotorcycleMovers';
import type { ServiceBookingConfirmationState } from '@/app/service-booking/confirmation/_lib/ServiceBookingConfirmationState';
import SubmittedRequestDetails from './SubmittedRequestDetails';

const CONFIRMATION_STORAGE_KEY = 'serviceBookingConfirmation';

function readConfirmationState(): ServiceBookingConfirmationState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CONFIRMATION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ServiceBookingConfirmationState) : null;
  } catch (error) {
    console.error('Error reading service booking confirmation data:', error);
    return null;
  }
}

export default function ServiceBookingConfirmationScreen() {
  // Read once into state, then clear the storage so a later visit can't replay
  // someone else's submission on a shared machine.
  const [state] = useState<ServiceBookingConfirmationState | null>(() => readConfirmationState());

  useEffect(() => {
    sessionStorage.removeItem(CONFIRMATION_STORAGE_KEY);
  }, []);

  return (
    <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <CheckCircle className="h-16 w-16 text-highlight1 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
            Request Submitted
          </h1>
          <p className="text-[var(--text-dark-secondary)] text-sm">
            We&apos;ve received your service request and will be in touch shortly to confirm your booking.
          </p>
        </div>

        <SubmittedRequestDetails state={state} />

        <Link
          href="/"
          className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
        >
          ← Back to Home
        </Link>
      </div>

      <MotorcycleMovers />
    </div>
  );
}

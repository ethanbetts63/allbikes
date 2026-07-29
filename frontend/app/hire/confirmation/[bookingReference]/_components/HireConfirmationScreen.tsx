'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import { getHireBookingByReference } from '@/lib/api';
import type { HireBooking } from '@/types/HireBooking';
import ConfirmedBookingDetails from './ConfirmedBookingDetails';
import PickupInstructions from './PickupInstructions';

export default function HireConfirmationScreen() {
  const params = useParams<{ bookingReference: string }>();
  const bookingReference = params.bookingReference;
  const router = useRouter();

  const [booking, setBooking] = useState<HireBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!bookingReference) return;
    let cancelled = false;
    getHireBookingByReference(bookingReference)
      .then((data) => { if (!cancelled) setBooking(data); })
      .catch(() => { if (!cancelled) setError('Booking not found.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [bookingReference]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-[var(--bg-light-primary)] min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-[var(--text-dark-secondary)] mb-4">{error || 'No booking found.'}</p>
          <button
            onClick={() => router.push('/hire')}
            className="text-sm underline text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)]"
          >
            Browse Hire Bikes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <CheckCircle className="h-16 w-16 text-highlight1 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
            Booking Confirmed
          </h1>
          <p className="text-[var(--text-dark-secondary)] text-sm">
            A confirmation email will be sent to you shortly.
          </p>
        </div>

        <ConfirmedBookingDetails booking={booking} />
        <PickupInstructions booking={booking} />

        <Link
          href="/hire"
          className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
        >
          ← Browse More Bikes
        </Link>
      </div>
    </div>
  );
}

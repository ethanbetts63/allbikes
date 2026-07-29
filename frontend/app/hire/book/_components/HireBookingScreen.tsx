'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Spinner } from '@/components/ui/spinner';
import { getBikeById, createHireBooking, getPublicHireSettings, getHireExtras } from '@/lib/api';
import type { HireExtra } from '@/types/HireBooking';
import type { HireBookingFormData } from '@/app/hire/book/_lib/HireBookingFormData';
import type { Bike } from '@/types/Bike';
import BookingSummaryCard from './BookingSummaryCard';
import ExtrasPicker from './ExtrasPicker';
import HireCustomerForm from './HireCustomerForm';
import { type HireDiscounts, effectiveDailyRate, hireDayCount } from '../_lib/hireBooking';

export default function HireBookingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bikeId = searchParams.get('bike');
  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';

  const [bike, setBike] = useState<Bike | null>(null);
  const [bondAmount, setBondAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [extras, setExtras] = useState<HireExtra[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<number, boolean>>({});
  const [minimumAge, setMinimumAge] = useState(21);
  const [discounts, setDiscounts] = useState<HireDiscounts | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!bikeId || !startDate || !endDate) {
      router.push('/hire');
      return;
    }

    let cancelled = false;
    Promise.all([getBikeById(bikeId), getPublicHireSettings(), getHireExtras()])
      .then(([bikeData, settings, extrasData]) => {
        if (cancelled) return;
        if (!bikeData.is_hire) {
          router.push('/hire');
          return;
        }
        setBike(bikeData);
        setBondAmount(parseFloat(settings.bond_amount));
        setMinimumAge(settings.minimum_age);
        setDiscounts({
          weekly_discount_percent: settings.weekly_discount_percent,
          monthly_discount_percent: settings.monthly_discount_percent,
        });
        setExtras(extrasData);
      })
      .catch(() => { if (!cancelled) setError('Failed to load bike details.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [bikeId, startDate, endDate, router]);

  const numDays = hireDayCount(startDate, endDate);
  const dailyRate = effectiveDailyRate(bike, numDays, discounts);
  const hireTotal = dailyRate !== null ? dailyRate * numDays : null;
  const extrasTotal = extras
    .filter(e => selectedExtras[e.id])
    .reduce((sum, e) => sum + parseFloat(e.price_per_day) * numDays, 0);

  const onSubmit = async (formData: HireBookingFormData) => {
    if (!bike) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const booking = await createHireBooking({
        motorcycle: bike.id,
        hire_start: startDate,
        hire_end: endDate,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        terms_accepted: true,
        is_of_age: true,
        extras: extras
          .filter(e => selectedExtras[e.id])
          .map(e => ({ extra_id: e.id, quantity: 1 })),
      });
      router.push(`/hire/book/${booking.booking_reference}/payment`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error || !bike) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Bike not found.'}</p>
          <button
            onClick={() => router.push('/hire')}
            className="text-sm underline text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)]"
          >
            Back to Hire
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-6">
          Complete Your Booking
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <BookingSummaryCard
            bike={bike}
            startDate={startDate}
            endDate={endDate}
            numDays={numDays}
            dailyRate={dailyRate}
            hireTotal={hireTotal}
            extrasTotal={extrasTotal}
            bondAmount={bondAmount}
          />

          <div>
            <ExtrasPicker
              extras={extras}
              selected={selectedExtras}
              onToggle={(id, checked) => setSelectedExtras(prev => ({ ...prev, [id]: checked }))}
            />
            <HireCustomerForm
              minimumAge={minimumAge}
              bondAmount={bondAmount}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

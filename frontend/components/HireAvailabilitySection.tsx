"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Wrench, Cog } from 'lucide-react';
import { getHireBikes } from '@/api';
import type { Bike } from '@/types/Bike';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import type { PublicHireSettings } from '@/types/PublicHireSettings';
import { formatRate } from '@/lib/hire';
import useHireDateConstraints from '@/hooks/useHireDateConstraints';

interface HireAvailabilitySectionProps {
  initialBikes?: Bike[];
  initialStartDate?: string;
  initialEndDate?: string;
  initialHireSettings?: PublicHireSettings | null;
  initialBlockedDates?: HireBlockedDate[];
}

const HireAvailabilitySection = ({
  initialBikes,
  initialStartDate,
  initialEndDate,
  initialHireSettings,
  initialBlockedDates = [],
}: HireAvailabilitySectionProps) => {
  const router = useRouter();
  const hasInitialBikes = initialBikes !== undefined;
  const initialFetchHandledRef = useRef(false);
  const [bikes, setBikes] = useState<Bike[]>(initialBikes ?? []);
  const [isLoading, setIsLoading] = useState(!hasInitialBikes);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => initialStartDate ?? '');
  const [endDate, setEndDate] = useState(() => initialEndDate ?? '');
  const [blockedDateError, setBlockedDateError] = useState<string | null>(null);
  const {
    minStartDate,
    maxStartDate,
    isRangeBlocked,
    monthlyDiscountPercent,
    error: settingsError,
  } = useHireDateConstraints({
    initialSettings: initialHireSettings,
    initialBlockedDates,
  });
  const displayError = error ?? settingsError;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!initialFetchHandledRef.current) {
      initialFetchHandledRef.current = true;
      if (hasInitialBikes) return;
    }

    if (startDate && endDate && isRangeBlocked(startDate, endDate)) return;

    queueMicrotask(() => {
      setIsLoading(true);
      setError(null);
    });
    const request = startDate && endDate
      ? getHireBikes(startDate, endDate)
      : getHireBikes();
    request
      .then((results) => {
        setBikes(results);
      })
      .catch(() => setError('Failed to load hire bikes.'))
      .finally(() => setIsLoading(false));
  }, [startDate, endDate, hasInitialBikes, isRangeBlocked]);

  const handleBook = (bike: Bike) => {
    if (!startDate || !endDate) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.warning('Please select your pick-up and return dates first.');
      return;
    }
    router.push(`/hire/book?bike=${bike.id}&start=${startDate}&end=${endDate}`);
  };

  const isBlockedSelection = Boolean(startDate && endDate && isRangeBlocked(startDate, endDate));

  return (
    <>
      <section className="bg-[var(--bg-dark-primary)] py-16 px-6">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-8">
          <div>
            <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
              ScooterShop Â· Dianella, Perth
            </p>
            <h1 className="text-4xl sm:text-5xl font-black uppercase italic text-[var(--text-light-primary)] leading-none">
              Select Your Hire Dates
            </h1>
          </div>

          <div className="w-full bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <Label htmlFor="start_date" className="text-[var(--text-light-secondary)] text-xs uppercase tracking-widest">
                  Pick-up Date
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  min={minStartDate}
                  max={maxStartDate}
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (endDate && val > endDate) setEndDate('');
                    setBlockedDateError(endDate && val ? (isRangeBlocked(val, endDate) ? 'These dates include a period when the shop is closed. Please choose different dates.' : null) : null);
                  }}
                  className="bg-white/10 border-white/20 text-[var(--text-light-primary)] [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <Label htmlFor="end_date" className="text-[var(--text-light-secondary)] text-xs uppercase tracking-widest">
                  Return Date
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  min={startDate || minStartDate}
                  max={maxStartDate}
                  value={endDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEndDate(val);
                    setBlockedDateError(startDate && val ? (isRangeBlocked(startDate, val) ? 'These dates include a period when the shop is closed. Please choose different dates.' : null) : null);
                  }}
                  className="bg-white/10 border-white/20 text-[var(--text-light-primary)] [color-scheme:dark]"
                />
              </div>
            </div>
            {blockedDateError ? (
              <p className="text-red-400 text-xs mt-3 text-center">{blockedDateError}</p>
            ) : (!startDate || !endDate) && (
              <p className="text-[var(--text-light-secondary)] text-xs mt-3 text-center">
                Select dates to check availability
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="bg-[var(--card)]">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Spinner className="h-12 w-12" />
            </div>
          )}

          {displayError && <p className="text-destructive text-center">{displayError}</p>}

          {!isLoading && !displayError && !isBlockedSelection && (
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h2 className="text-lg font-black uppercase italic text-[var(--text-dark-primary)]">
                {startDate && endDate ? 'Available Bikes' : 'Our Hire Fleet'}
              </h2>
              <span className="text-sm text-[var(--text-dark-secondary)] shrink-0">
                {bikes.length} {bikes.length === 1 ? 'bike' : 'bikes'}
                {startDate && endDate ? ' available' : ''}
              </span>
            </div>
          )}

          {!isLoading && !displayError && !isBlockedSelection && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bikes.length > 0 ? (
                bikes.map((bike, index) => {
                  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
                  const primaryImage = sortedImages[0];
                  const imageUrl = primaryImage?.thumbnail || primaryImage?.medium || primaryImage?.image || '/src/assets/motorcycle_images/placeholder.png';
                  const title = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
                  const isPriorityImage = index === 0;

                  return (
                    <div key={bike.id} className="bg-[var(--card)] border border-[var(--border-light)] flex flex-col h-full">
                      <div className="relative aspect-[4/3] overflow-hidden shrink-0">
                        <img
                          src={imageUrl}
                          alt={title}
                          className="w-full h-full object-contain"
                          loading={isPriorityImage ? 'eager' : 'lazy'}
                          fetchPriority={isPriorityImage ? 'high' : 'auto'}
                        />
                        <span className="absolute bottom-2 left-2 bg-black/60 text-[var(--text-light-primary)] text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded capitalize">
                          {bike.condition}
                        </span>
                      </div>

                      <div className="px-4 py-4 flex flex-col gap-2.5 flex-1">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">{bike.make}</p>
                          <h3 className="text-base font-bold text-[var(--text-dark-primary)] leading-snug">
                            {bike.year && <span className="text-[var(--text-dark-secondary)] font-normal">{bike.year} </span>}
                            {bike.model}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-[var(--text-dark-secondary)]">
                          {bike.engine_size && (
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3.5 w-3.5" />
                              {bike.engine_size}cc
                            </span>
                          )}
                          {bike.transmission && (
                            <span className="flex items-center gap-1">
                              <Cog className="h-3.5 w-3.5" />
                              {bike.transmission}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto pt-3 border-t border-[var(--border-light)] space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-dark-primary)] font-black text-xl">
                              {formatRate(bike, monthlyDiscountPercent)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleBook(bike)}
                            >
                              {startDate && endDate ? 'Book Now' : 'Choose Dates'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="col-span-3 py-16 text-center text-[var(--text-dark-secondary)]">
                  {startDate && endDate
                    ? 'No bikes are available for those dates. Try different dates.'
                    : 'No hire bikes are currently available. Check back soon.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HireAvailabilitySection;

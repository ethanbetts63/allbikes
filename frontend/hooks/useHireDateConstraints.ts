import { useState, useEffect, useCallback } from 'react';
import { getPublicHireSettings, getHireBlockedDates } from '@/api';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import type { HireDateConstraints } from '@/types/HireDateConstraints';
import type { PublicHireSettings } from '@/types/PublicHireSettings';

interface UseHireDateConstraintsOptions {
  initialSettings?: PublicHireSettings | null;
  initialBlockedDates?: HireBlockedDate[];
}

const getDateLimits = (settings?: PublicHireSettings | null) => {
  if (!settings) return { minStartDate: '', maxStartDate: '' };

  const min = new Date();
  min.setDate(min.getDate() + settings.advance_min_days);
  const max = new Date();
  max.setDate(max.getDate() + settings.advance_max_days);

  return {
    minStartDate: min.toISOString().split('T')[0],
    maxStartDate: max.toISOString().split('T')[0],
  };
};

const useHireDateConstraints = (options: UseHireDateConstraintsOptions = {}): HireDateConstraints => {
  const initialLimits = getDateLimits(options.initialSettings);
  const [minStartDate, setMinStartDate] = useState(initialLimits.minStartDate);
  const [maxStartDate, setMaxStartDate] = useState(initialLimits.maxStartDate);
  const [blockedDates, setBlockedDates] = useState<HireBlockedDate[]>(options.initialBlockedDates ?? []);
  const [weeklyDiscountPercent, setWeeklyDiscountPercent] = useState<number | null>(options.initialSettings?.weekly_discount_percent ?? null);
  const [monthlyDiscountPercent, setMonthlyDiscountPercent] = useState<number | null>(options.initialSettings?.monthly_discount_percent ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options.initialSettings && options.initialBlockedDates) return;

    Promise.all([getPublicHireSettings(), getHireBlockedDates()])
      .then(([settings, blocked]) => {
        const limits = getDateLimits(settings);
        setMinStartDate(limits.minStartDate);
        setMaxStartDate(limits.maxStartDate);
        setBlockedDates(blocked);
        setWeeklyDiscountPercent(settings.weekly_discount_percent);
        setMonthlyDiscountPercent(settings.monthly_discount_percent);
      })
      .catch(() => setError('Failed to load hire settings.'));
  }, [options.initialBlockedDates, options.initialSettings]);

  const isRangeBlocked = useCallback(
    (start: string, end: string) => blockedDates.some(b => b.date_from <= end && b.date_to >= start),
    [blockedDates]
  );

  return { minStartDate, maxStartDate, blockedDates, isRangeBlocked, weeklyDiscountPercent, monthlyDiscountPercent, error };
};

export default useHireDateConstraints;

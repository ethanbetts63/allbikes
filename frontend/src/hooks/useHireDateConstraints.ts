import { useState, useEffect } from 'react';
import { getPublicHireSettings, getHireBlockedDates } from '@/api';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import type { HireDateConstraints } from '@/types/HireDateConstraints';

const useHireDateConstraints = (): HireDateConstraints => {
  const [minStartDate, setMinStartDate] = useState('');
  const [maxStartDate, setMaxStartDate] = useState('');
  const [blockedDates, setBlockedDates] = useState<HireBlockedDate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPublicHireSettings(), getHireBlockedDates()])
      .then(([settings, blocked]) => {
        const min = new Date();
        min.setDate(min.getDate() + settings.advance_min_days);
        setMinStartDate(min.toISOString().split('T')[0]);
        const max = new Date();
        max.setDate(max.getDate() + settings.advance_max_days);
        setMaxStartDate(max.toISOString().split('T')[0]);
        setBlockedDates(blocked);
      })
      .catch(() => setError('Failed to load hire settings.'));
  }, []);

  const isRangeBlocked = (start: string, end: string) =>
    blockedDates.some(b => b.date_from <= end && b.date_to >= start);

  return { minStartDate, maxStartDate, blockedDates, isRangeBlocked, error };
};

export default useHireDateConstraints;

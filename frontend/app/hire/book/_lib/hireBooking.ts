import type { Bike } from '@/types/Bike';

export interface HireDiscounts {
  weekly_discount_percent: number;
  monthly_discount_percent: number;
}

/** Hire length in days, counting both the pick-up and return days. */
export const hireDayCount = (start: string, end: string) => {
  if (!start || !end) return 0;
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.round(ms / 86400000) + 1;
};

/**
 * Daily rate after any length-of-hire discount, or null when the bike has no
 * rate set. Monthly wins over weekly; both round up to the dollar.
 */
export const effectiveDailyRate = (
  bike: Bike | null,
  numDays: number,
  discounts: HireDiscounts | null,
): number | null => {
  if (!bike || !discounts) return null;
  if (!bike.daily_rate || parseFloat(bike.daily_rate) <= 0) return null;
  const daily = parseFloat(bike.daily_rate);
  if (numDays >= 30 && discounts.monthly_discount_percent > 0) {
    return Math.ceil(daily * (1 - discounts.monthly_discount_percent / 100));
  }
  if (numDays >= 7 && discounts.weekly_discount_percent > 0) {
    return Math.ceil(daily * (1 - discounts.weekly_discount_percent / 100));
  }
  return daily;
};

export const bikeLabel = (bike: Bike) =>
  bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

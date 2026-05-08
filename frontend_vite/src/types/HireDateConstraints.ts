import type { HireBlockedDate } from '@/types/HireBlockedDate';

export interface HireDateConstraints {
  minStartDate: string;
  maxStartDate: string;
  blockedDates: HireBlockedDate[];
  isRangeBlocked: (start: string, end: string) => boolean;
  weeklyDiscountPercent: number | null;
  monthlyDiscountPercent: number | null;
  error: string | null;
}

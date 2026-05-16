import type { HireSettings } from '@/types/HireBooking';

export type PublicHireSettings = Pick<HireSettings, 'bond_amount' | 'advance_min_days' | 'advance_max_days' | 'minimum_age' | 'weekly_discount_percent' | 'monthly_discount_percent'>;

import { format, isValid, startOfWeek } from 'date-fns';

import type { Booking } from '@/types/Booking';

export const DIARY_PATH = '/dashboard/service-diary';

/** Link to the diary showing the week that contains `date`. */
export const diaryWeekHref = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const base = isValid(d) ? d : new Date();
  return `${DIARY_PATH}?week=${format(startOfWeek(base, { weekStartsOn: 1 }), 'yyyy-MM-dd')}`;
};

/** "14:30" -> "2:30 PM". Null when the booking has no drop-off time. */
export const formatTime = (t: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${period}`;
};

export const vehicleLabel = (b: Booking) =>
  [b.year, b.make, b.model].filter(Boolean).join(' ').trim();

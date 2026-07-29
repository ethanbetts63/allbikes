import { format, isValid, startOfWeek } from 'date-fns';

import type { Booking, BookingInput } from '@/types/Booking';

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

/** A saved booking as the editable form shape. */
export const bookingToInput = (b: Booking): BookingInput => ({
  drop_off_date: b.drop_off_date,
  drop_off_time: b.drop_off_time ? b.drop_off_time.slice(0, 5) : null,
  customer_name: b.customer_name,
  customer_phone: b.customer_phone,
  customer_email: b.customer_email,
  street_address: b.street_address,
  suburb: b.suburb,
  postcode: b.postcode,
  registration: b.registration,
  make: b.make,
  model: b.model,
  year: b.year,
  odometer: b.odometer,
  job_description: b.job_description,
  status: b.status,
});

export const emptyBooking: BookingInput = {
  drop_off_date: '',
  drop_off_time: null,
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  street_address: '',
  suburb: '',
  postcode: '',
  registration: '',
  make: '',
  model: '',
  year: '',
  odometer: '',
  job_description: '',
  status: 'accepted',
};

/** Both booking forms require at least these two fields. */
export const canSaveBooking = (value: BookingInput) =>
  Boolean(value.drop_off_date && value.customer_name.trim());

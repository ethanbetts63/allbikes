export type BookingStatus =
  | 'requested'
  | 'not_started'
  | 'in_progress'
  | 'finished_paid';

export type BookingSource = 'website' | 'manual';

export interface Booking {
  id: number;
  drop_off_date: string;        // YYYY-MM-DD
  drop_off_time: string | null; // HH:MM:SS or null
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  bike_name: string;
  registration: string;
  job_description: string;
  status: BookingStatus;
  status_display: string;
  source: BookingSource;
  source_display: string;
  booking_log: number | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// Fields writable when creating/editing a booking.
export interface BookingInput {
  drop_off_date: string;
  drop_off_time?: string | null;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  bike_name?: string;
  registration?: string;
  job_description?: string;
  status?: BookingStatus;
}

export interface BlockedDate {
  id: number;
  date: string; // YYYY-MM-DD
  reason: string;
  created_at: string;
}

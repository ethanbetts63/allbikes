export interface ServiceSettings {
  id: number;
  booking_advance_notice: number;
  drop_off_start_time: string;
  drop_off_end_time: string;
  use_mechanic_desk_blocked_dates: boolean;
  always_blocked_weekdays: string; // CSV of weekday numbers, Mon=0 … Sun=6
  reminder_emails_enabled: boolean;
  reminder_days_before: number;
}

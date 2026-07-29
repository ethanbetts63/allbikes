export interface ServiceBookingConfirmationState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  make: string;
  model: string;
  year?: string;
  registration_number: string;
  drop_off_time: string;
  job_type_names: string[];
  note?: string;
}

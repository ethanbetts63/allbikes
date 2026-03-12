export interface BookingFormData {
  [key: string]: any;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  street_line?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  registration_number: string;
  make: string;
  model: string;
  year?: number | null;
  color?: string;
  transmission?: string;
  vin?: string;
  fuel_type?: string;
  drive_type?: string;
  engine_size?: string;
  body?: string;
  odometer?: number | null;
  drop_off_time: string;
  pickup_time?: string;
  job_type_names: string[];
  courtesy_vehicle_requested: boolean;
  note?: string;
}

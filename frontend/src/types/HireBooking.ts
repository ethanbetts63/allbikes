export interface HireExtra {
  id: number;
  name: string;
  price_per_day: string;
  is_active: boolean;
}

export interface HireBookingExtra {
  id: number;
  name: string;
  quantity: number;
  price_per_day_snapshot: string;
  total_amount: string;
}

export interface HireBooking {
  id: number;
  booking_reference: string;
  motorcycle: number;
  motorcycle_name: string;
  hire_start: string;
  hire_end: string;
  effective_daily_rate: string;
  total_hire_amount: string;
  bond_amount: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: 'pending_payment' | 'confirmed' | 'active' | 'returned' | 'cancelled';
  is_of_age: boolean;
  extras: HireBookingExtra[];
  created_at: string;
  updated_at: string;
}

export interface HireSettings {
  bond_amount: string;
  advance_min_days: number;
  advance_max_days: number;
  minimum_age: number;
  booking_gap_days: number;
  updated_at: string;
}

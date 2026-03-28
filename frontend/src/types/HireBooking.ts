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
  created_at: string;
  updated_at: string;
}

export interface HireSettings {
  bond_amount: string;
  advance_min_days: number;
  advance_max_days: number;
  updated_at: string;
}

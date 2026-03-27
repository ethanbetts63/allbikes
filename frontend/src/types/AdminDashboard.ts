export interface DashboardOrder {
  id: number;
  order_reference: string;
  payment_type: 'full' | 'deposit';
  customer_name: string;
  created_at: string;
}

export interface DashboardBike {
  id: number;
  slug: string;
  make: string;
  model: string;
  year: number | null;
}

export interface DashboardProduct {
  id: number;
  slug: string;
  name: string;
  stock_quantity: number;
  in_stock: boolean;
  low_stock: boolean;
}

export interface DashboardHireBooking {
  id: number;
  booking_reference: string;
  motorcycle_name: string;
  customer_name: string;
  hire_start: string;
  hire_end: string;
  status: string;
}

export interface AdminDashboard {
  paid_orders: DashboardOrder[];
  reserved_bikes: DashboardBike[];
  attention_products: DashboardProduct[];
  active_hire_bookings: DashboardHireBooking[];
}

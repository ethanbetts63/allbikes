export interface Order {
  id: number;
  order_reference: string;
  payment_type: 'full' | 'deposit';
  product: number | null;
  product_name: string | null;
  motorcycle: number | null;
  motorcycle_name: string | null;
  amount_paid: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  state: string;
  postcode: string;
  status: string;
  created_at: string;
  updated_at: string;
}

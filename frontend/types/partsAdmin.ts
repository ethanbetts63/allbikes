export interface AdminPartsOrderListItem {
  id: number;
  order_reference: string;
  customer_name: string;
  customer_email: string;
  status: string;
  has_backorder: boolean;
  total: string;
  item_count: number;
  created_at: string;
}

export interface AdminPartsOrderItem {
  id: number;
  part_number: string;
  description: string;
  colour_name: string;
  model_name: string;
  model_code: string;
  section_code: string;
  ref_number: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  status: 'ordered' | 'fulfilled' | 'refunded';
  backordered: boolean;
  backorder_since: string | null;
  backorder_days_remaining: number | null;
  backorder_overdue: boolean;
}

export interface AdminPartsOrder {
  id: number;
  order_reference: string;
  status: string;
  has_backorder: boolean;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  subtotal: string;
  shipping: string;
  total: string;
  amount_paid: string | null;
  admin_notes: string;
  dispatched_at: string | null;
  created_at: string;
  updated_at: string;
  items: AdminPartsOrderItem[];
  stripe_payment_intent_id: string | null;
  payment_status: string | null;
}

export interface Paginated<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export type ItemAction =
  | 'place_backorder'
  | 'remove_backorder'
  | 'mark_fulfilled'
  | 'mark_refunded'
  | 'mark_ordered';

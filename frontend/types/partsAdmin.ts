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
  status: 'to_order' | 'completed' | 'refunded';
  backordered: boolean;
  /** Current supplier cost for this line; null when the part has no live feed price. */
  supplier_line_total: number | null;
  gross_profit: number | null;
}

export interface AdminPartsOrderMargin {
  supplier_parts_total: number;
  customer_parts_total: number;
  gross_profit_total: number;
  has_unpriced_items: boolean;
}

export interface AdminPartsOrder {
  id: number;
  order_reference: string;
  status: string;
  has_backorder: boolean;
  backorder_days_remaining: number;
  backorder_window_expired: boolean;
  backorder_hold_days: number;
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
  margin: AdminPartsOrderMargin;
  stripe_payment_intent_id: string | null;
  payment_status: string | null;
  messages: Array<{ id: number; message_type: string; to: string; subject: string; status: string; sent_at: string | null; created_at: string }>;
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
  | 'mark_refunded'
  | 'mark_to_order';

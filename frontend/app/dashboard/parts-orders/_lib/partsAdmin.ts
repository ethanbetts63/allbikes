import type { SentMessage } from '@/types/SentMessage';

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
  rrp_unit_price_incl_gst: string | null;
  rrp_line_total_incl_gst: string | null;
  supplier_discount_percentage: string | null;
  supplier_unit_cost_incl_gst: string | null;
  supplier_line_total_incl_gst: string | null;
  markup_percentage: string | null;
  unit_price: string;
  line_total: string;
  status: 'to_order' | 'completed' | 'refunded';
  backordered: boolean;
  gross_profit_ex_gst: string | null;
  profit_margin_percentage: string | null;
}

interface AdminPartsOrderMargin {
  supplier_parts_total_incl_gst: number;
  customer_parts_total_incl_gst: number;
  gross_profit_ex_gst_total: number;
  profit_margin_percentage: number;
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
  messages: SentMessage[];
}

export interface Paginated<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

/** The three fixed customer emails an operator can trigger for an order. */
export type CustomerUpdateType = 'backorder' | 'refund' | 'arranged';

export type ItemAction =
  | 'place_backorder'
  | 'remove_backorder'
  | 'mark_refunded'
  | 'mark_to_order';

interface OrderBase {
  id: number;
  order_reference: string;
  amount_paid: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductOrder extends OrderBase {
  order_kind: 'product';
  product: number;
  product_name: string;
  unit_price_incl_gst: string;
  total: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  state: string;
  postcode: string;
  country: 'Australia';
}

export interface BikeOrder extends OrderBase {
  order_kind: 'bike';
  motorcycle: number;
  motorcycle_name: string;
  selected_colour: string;
  deposit_amount: string;
}

export type Order = ProductOrder | BikeOrder;

export interface CreatedOrder {
  id: number;
  order_kind: Order['order_kind'];
  order_reference: string;
  access_token: string;
}

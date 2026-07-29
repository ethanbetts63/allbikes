export interface NotificationOrder {
  id: number;
  order_reference: string;
  order_kind: 'product' | 'bike';
  customer_name: string;
  item_name: string;
  created_at: string;
}

export interface NotificationProductOrder {
  id: number;
  order_reference: string;
  customer_name: string;
  product_name: string;
  created_at: string;
}

export interface NotificationBikeOrder {
  id: number;
  order_reference: string;
  customer_name: string;
  motorcycle_name: string;
  created_at: string;
}

export interface NotificationBike {
  id: number;
  slug: string;
  make: string;
  model: string;
  year: number | null;
}

export interface NotificationProduct {
  id: number;
  slug: string;
  name: string;
  stock_quantity: number;
  in_stock: boolean;
  low_stock: boolean;
}

export interface NotificationHireBooking {
  id: number;
  booking_reference: string;
  motorcycle_name: string;
  customer_name: string;
  hire_start: string;
  hire_end: string;
  status: string;
}

export interface NotificationPartsOrder {
  id: number;
  order_reference: string;
  customer_name: string;
  status: string;
  has_backorder: boolean;
  item_count: number;
  created_at: string;
}

export interface AdminNotifications {
  product_orders_to_action: NotificationProductOrder[];
  bike_orders_to_action: NotificationBikeOrder[];
  reserved_bikes: NotificationBike[];
  attention_products: NotificationProduct[];
  active_hire_bookings: NotificationHireBooking[];
  /** Parts orders that have not reached completed / cancelled / refunded. */
  parts_orders_to_action: NotificationPartsOrder[];
}

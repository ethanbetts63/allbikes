'use client';

import type { PartsCartItem } from '@/types/parts';

export interface PartsOrderItemDetail {
  part_number: string;
  description: string;
  colour_name: string | null;
  model_name: string;
  model_code: string;
  section_code: string;
  ref_number: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  backordered: boolean;
}

export interface PartsOrderDetail {
  order_reference: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  has_backorder: boolean;
  subtotal: string;
  shipping: string;
  total: string;
  amount_paid: string | null;
  items: PartsOrderItemDetail[];
}

export interface PartsOrderCreated {
  order_reference: string;
  access_token: string;
}

export interface CustomerDetails {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  terms_accepted: boolean;
}

export async function createPartsOrder(
  customer: CustomerDetails,
  items: PartsCartItem[],
): Promise<PartsOrderCreated> {
  const res = await fetch('/api/parts/orders/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...customer,
      items: items.map((i) => ({
        part_number: i.part_number,
        section_part_id: i.section_part_id,
        quantity: i.quantity,
      })),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.detail || 'Could not create your order.') as Error & { unavailable?: string[] };
    err.unavailable = body.unavailable;
    throw err;
  }
  return res.json();
}

export async function getPartsOrder(reference: string, accessToken: string): Promise<PartsOrderDetail> {
  const res = await fetch(`/api/parts/orders/${reference}/confirmation/?token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new Error('Order not found.');
  return res.json();
}

export async function createPartsPaymentIntent(reference: string, accessToken: string): Promise<{ clientSecret: string }> {
  const res = await fetch('/api/parts/create-payment-intent/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_reference: reference, access_token: accessToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Could not start payment.');
  }
  return res.json();
}

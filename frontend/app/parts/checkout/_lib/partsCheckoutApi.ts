'use client';

import type { PartsCartItem } from '@/types/parts';
import { partsJson } from '@/lib/partsHttp';

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
  has_backorder: boolean;
  backorder_hold_days: number;
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
        fitment_key: i.fitment_key,
        section_part_id: i.fitment_key ? undefined : i.section_part_id,
        quantity: i.quantity,
      })),
    }),
  });
  return partsJson<PartsOrderCreated>(res, 'Could not create your order.');
}

export async function getPartsOrder(reference: string, accessToken: string): Promise<PartsOrderDetail> {
  const res = await fetch(`/api/parts/orders/${reference}/confirmation/?token=${encodeURIComponent(accessToken)}`);
  return partsJson<PartsOrderDetail>(res, 'Order not found.');
}

export async function createPartsPaymentIntent(reference: string, accessToken: string): Promise<{ clientSecret: string }> {
  const res = await fetch('/api/parts/create-payment-intent/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_reference: reference, access_token: accessToken }),
  });
  return partsJson<{ clientSecret: string }>(res, 'Could not start payment.');
}

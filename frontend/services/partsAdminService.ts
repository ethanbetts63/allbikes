import { authedFetch } from '../apiClient';
import type {
  AdminPartsOrder,
  AdminPartsOrderListItem,
  ItemAction,
  Paginated,
} from '@/types/partsAdmin';

interface ListParams {
  status?: string;
  has_backorder?: boolean;
  q?: string;
  page?: number;
  ordering?: string;
}

export async function adminGetPartsOrders(params: ListParams = {}): Promise<Paginated<AdminPartsOrderListItem>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.has_backorder) qs.set('has_backorder', 'true');
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.ordering) qs.set('ordering', params.ordering);
  const res = await authedFetch(`/api/parts/admin/orders/?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load orders.');
  return res.json();
}

export async function adminGetPartsOrder(id: number): Promise<AdminPartsOrder> {
  const res = await authedFetch(`/api/parts/admin/orders/${id}/`);
  if (!res.ok) throw new Error('Failed to load order.');
  return res.json();
}

export async function adminUpdatePartsOrder(
  id: number,
  data: { status?: string; admin_notes?: string },
): Promise<AdminPartsOrder> {
  const res = await authedFetch(`/api/parts/admin/orders/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update order.');
  return res.json();
}

export async function adminUpdatePartsOrderItem(itemId: number, action: ItemAction): Promise<AdminPartsOrder> {
  const res = await authedFetch(`/api/parts/admin/items/${itemId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to update item.');
  return res.json();
}

export interface SupplierEmailDraftItem {
  part_number: string;
  description: string;
  quantity: number;
  unit_price: number | null;
  line_total: number | null;
}

export interface SupplierEmailDraft {
  to: '';
  subject: string;
  body: string;
  items: SupplierEmailDraftItem[];
  supplier_parts_total: number;
  has_unpriced_items: boolean;
}

export async function adminGetPartsSupplierEmailDraft(id: number): Promise<SupplierEmailDraft> {
  const res = await authedFetch(`/api/parts/admin/orders/${id}/supplier-email/`);
  if (!res.ok) throw new Error('Failed to load supplier email draft.');
  return res.json();
}

export async function adminSendPartsSupplierEmail(id: number, data: { to: string; subject: string; body: string }): Promise<void> {
  const res = await authedFetch(`/api/parts/admin/orders/${id}/supplier-email/`, {
    method: 'POST', body: JSON.stringify(data),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || payload.to?.[0] || 'Supplier email could not be sent.');
  }
}

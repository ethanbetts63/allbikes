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
}

export async function adminGetPartsOrders(params: ListParams = {}): Promise<Paginated<AdminPartsOrderListItem>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.has_backorder) qs.set('has_backorder', 'true');
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
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

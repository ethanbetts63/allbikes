import { authedFetch } from '../../../../lib/apiClient';
import type {
  AdminPartsOrder,
  AdminPartsOrderListItem,
  CustomerUpdateType,
  ItemAction,
  Paginated,
} from '@/app/dashboard/parts-orders/_lib/partsAdmin';
import { partsJson, partsOk } from '@/lib/partsHttp';

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
  return partsJson<Paginated<AdminPartsOrderListItem>>(res, 'Failed to load orders.');
}

export async function adminGetPartsOrder(reference: string): Promise<AdminPartsOrder> {
  const res = await authedFetch(`/api/parts/admin/orders/${encodeURIComponent(reference)}/`);
  return partsJson<AdminPartsOrder>(res, 'Failed to load order.');
}

export async function adminUpdatePartsOrder(
  reference: string,
  data: { status?: string; admin_notes?: string },
): Promise<AdminPartsOrder> {
  const res = await authedFetch(`/api/parts/admin/orders/${encodeURIComponent(reference)}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return partsJson<AdminPartsOrder>(res, 'Failed to update order.');
}

export async function adminUpdatePartsOrderItem(itemId: number, action: ItemAction): Promise<AdminPartsOrder> {
  const res = await authedFetch(`/api/parts/admin/items/${itemId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
  return partsJson<AdminPartsOrder>(res, 'Failed to update item.');
}

interface SupplierEmailDraftItem {
  part_number: string;
  description: string;
  quantity: number;
  unit_price: number | null;
  line_total: number | null;
  customer_unit_price: number;
  customer_line_total: number;
  gross_profit_ex_gst: number | null;
  profit_margin_percentage: number | null;
}

export interface SupplierEmailDraft {
  to: '';
  subject: string;
  body: string;
  items: SupplierEmailDraftItem[];
  supplier_parts_total_incl_gst: number;
  customer_parts_total_incl_gst: number;
  gross_profit_ex_gst_total: number;
  profit_margin_percentage: number;
  has_unpriced_items: boolean;
}

export async function adminGetPartsSupplierEmailDraft(reference: string): Promise<SupplierEmailDraft> {
  const res = await authedFetch(`/api/parts/admin/orders/${encodeURIComponent(reference)}/supplier-email/`);
  return partsJson<SupplierEmailDraft>(res, 'Failed to load supplier email draft.');
}

export async function adminSendPartsSupplierEmail(reference: string, data: { to: string; subject: string; body: string }): Promise<void> {
  const res = await authedFetch(`/api/parts/admin/orders/${encodeURIComponent(reference)}/supplier-email/`, {
    method: 'POST', body: JSON.stringify(data),
  });
  await partsOk(res, 'Supplier email could not be sent.');
}

export async function adminSendPartsCustomerUpdate(reference: string, type: CustomerUpdateType): Promise<void> {
  const res = await authedFetch(`/api/parts/admin/orders/${encodeURIComponent(reference)}/customer-update/`, {
    method: 'POST', body: JSON.stringify({ type }),
  });
  await partsOk(res, 'Customer update could not be sent.');
}

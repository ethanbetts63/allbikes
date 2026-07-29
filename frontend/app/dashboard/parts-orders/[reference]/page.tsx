'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDate } from '@/utils/formatting';
import { Spinner } from '@/components/ui/spinner';
import {
  adminGetPartsOrder, adminUpdatePartsOrder, adminUpdatePartsOrderItem,
  adminSendPartsCustomerUpdate,
} from '@/services/partsAdminService';
import type { AdminPartsOrder, CustomerUpdateType, ItemAction } from '@/types/partsAdmin';
import CommunicationHistory from '../_components/CommunicationHistory';
import CustomerSummary from '../_components/CustomerSummary';
import InternalNotes from '../_components/InternalNotes';
import OrderItemsTable from '../_components/OrderItemsTable';
import OrderStatusBanner from '../_components/OrderStatusBanner';
import OrderTotals from '../_components/OrderTotals';
import RefundsToProcess from '../_components/RefundsToProcess';
import SendEmailPanel from '../_components/SendEmailPanel';

/** Copy shown before an email actually goes to the customer. */
const CONFIRM_COPY: Record<CustomerUpdateType, string> = {
  backorder: 'This will send an email to the customer. This type should only be sent if one or more items in the order are on backorder.',
  refund: 'This will send an email to the customer. This type should only be sent after the relevant Stripe refund has been processed.',
  arranged: 'This will send an email to the customer. This type should only be sent once you have arranged the order with the supplier.',
};

export default function PartsOrderDetailPage() {
  const { reference } = useParams<{ reference: string }>();
  const [order, setOrder] = useState<AdminPartsOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!reference) return;
    adminGetPartsOrder(reference)
      .then((o) => { setOrder(o); setStatus(o.status); setNotes(o.admin_notes); })
      .catch(() => toast.error('Failed to load order.'))
      .finally(() => setLoading(false));
  }, [reference]);

  const refresh = (o: AdminPartsOrder) => { setOrder(o); setStatus(o.status); };

  const saveOrder = async () => {
    if (!order) return;
    setBusy(true);
    try {
      refresh(await adminUpdatePartsOrder(order.order_reference, { status, admin_notes: notes }));
      toast.success('Saved.');
    } catch { toast.error('Save failed.'); }
    finally { setBusy(false); }
  };

  const itemAction = async (itemId: number, action: ItemAction) => {
    setBusy(true);
    try { refresh(await adminUpdatePartsOrderItem(itemId, action)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Action failed.'); }
    finally { setBusy(false); }
  };

  const customerUpdate = async (type: CustomerUpdateType) => {
    if (!order || !confirm(CONFIRM_COPY[type])) return;
    setBusy(true);
    try {
      await adminSendPartsCustomerUpdate(order.order_reference, type);
      refresh(await adminGetPartsOrder(order.order_reference));
      toast.success('Customer update sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Customer update failed.');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-12 w-12" /></div>;
  if (!order) return <p className="p-6 text-destructive">Order not found.</p>;

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-lg bg-[var(--bg-light-primary)] p-4 text-[var(--text-dark-primary)]">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h1 className="font-mono text-2xl font-bold">{order.order_reference}</h1>
        </div>

        <RefundsToProcess
          items={order.items.filter((i) => i.status === 'refunded')}
          paymentIntentId={order.stripe_payment_intent_id}
        />

        <OrderStatusBanner
          order={order}
          status={status}
          busy={busy}
          onStatusChange={setStatus}
          onSave={saveOrder}
        />

        <CustomerSummary order={order} />

        <OrderItemsTable order={order} busy={busy} onItemAction={itemAction} />

        <OrderTotals order={order} />

        <SendEmailPanel order={order} busy={busy} onCustomerUpdate={customerUpdate} />

        <CommunicationHistory messages={order.messages} />

        <InternalNotes notes={notes} busy={busy} onChange={setNotes} onSave={saveOrder} />

        <p className="mb-4 text-xs text-[var(--text-dark-secondary)]">
          Placed {formatDate(order.created_at)} · Payment {order.payment_status ?? '—'}
        </p>

        <Link href="/dashboard/parts-orders" className="text-sm underline underline-offset-2 hover:text-[var(--text-dark-primary)]">
          ← Back to Parts Orders
        </Link>
      </div>
    </div>
  );
}

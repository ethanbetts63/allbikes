'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/utils/formatting';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  adminGetPartsOrder, adminUpdatePartsOrder, adminUpdatePartsOrderItem,
  adminSendPartsCustomerUpdate,
} from '@/services/partsAdminService';
import type { AdminPartsOrder, AdminPartsOrderItem, ItemAction } from '@/types/partsAdmin';
import { PARTS_STATUS_BADGE, BTN_INACTIVE } from '../PartsOrdersListPage';

const ORDER_STATUSES = ['pending_payment', 'paid', 'dispatched', 'completed', 'cancelled', 'refunded', 'partially_refunded'];

export default function PartsOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminPartsOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!id) return;
    adminGetPartsOrder(Number(id))
      .then((o) => { setOrder(o); setStatus(o.status); setNotes(o.admin_notes); })
      .catch(() => setMsg({ text: 'Failed to load order.', error: true }))
      .finally(() => setLoading(false));
  }, [id]);

  const refresh = (o: AdminPartsOrder) => { setOrder(o); setStatus(o.status); };

  const saveOrder = async () => {
    if (!order) return;
    setBusy(true); setMsg(null);
    try {
      refresh(await adminUpdatePartsOrder(order.id, { status, admin_notes: notes }));
      setMsg({ text: 'Saved.' });
    } catch { setMsg({ text: 'Save failed.', error: true }); }
    finally { setBusy(false); }
  };

  const itemAction = async (itemId: number, action: ItemAction) => {
    setBusy(true); setMsg(null);
    try { refresh(await adminUpdatePartsOrderItem(itemId, action)); }
    catch { setMsg({ text: 'Action failed.', error: true }); }
    finally { setBusy(false); }
  };
  const customerUpdate = async (type: 'backorder' | 'refund' | 'arranged') => {
    const confirmationCopy = {
      backorder: 'This will send an email to the customer. This type should only be sent if one or more items in the order are on backorder.',
      refund: 'This will send an email to the customer. This type should only be sent after the relevant Stripe refund has been processed.',
      arranged: 'This will send an email to the customer. This type should only be sent once you have arranged the order with the supplier.',
    };
    if (!order || !confirm(confirmationCopy[type])) return;
    setBusy(true); setMsg(null);
    try { await adminSendPartsCustomerUpdate(order.id, type); refresh(await adminGetPartsOrder(order.id)); setMsg({ text: 'Customer update sent.' }); }
    catch (error) { setMsg({ text: error instanceof Error ? error.message : 'Customer update failed.', error: true }); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-12 w-12" /></div>;
  if (!order) return <p className="p-6 text-destructive">Order not found.</p>;

  const refundedItems = order.items.filter((i) => i.status === 'refunded');
  const address = [order.address_line1, order.address_line2, `${order.suburb} ${order.state} ${order.postcode}`, order.country]
    .filter(Boolean).join(', ');

  return (
    <div className="p-4 md:p-6">
      {msg && (
        <Alert variant={msg.error ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg bg-[var(--bg-light-primary)] p-4 text-[var(--text-dark-primary)]">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h1 className="font-mono text-2xl font-bold">{order.order_reference}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className={PARTS_STATUS_BADGE[order.status] ?? 'border-gray-400'}>
                {order.status.replace(/_/g, ' ')}
              </Badge>
              {order.has_backorder && <Badge variant="outline" className="border-orange-500 text-orange-600">Backorder</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.status === 'paid' && (
              <Button asChild className="border-sky-700 bg-sky-600 text-white hover:bg-sky-700 hover:text-white">
                <Link href={`/dashboard/parts-orders/${order.id}/supplier-email`}>Email supplier</Link>
              </Button>
            )}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <Button onClick={saveOrder} disabled={busy}>Save</Button>
          </div>
        </div>

        {/* Refund-in-Stripe prompt */}
        {refundedItems.length > 0 && (
          <div className="mb-6 rounded-md border border-orange-400 bg-orange-50 p-4 text-sm">
            <p className="font-bold text-orange-800">Refunds to process in Stripe</p>
            <p className="mt-1 text-orange-700">
              Payment intent:{' '}
              <span className="font-mono">{order.stripe_payment_intent_id ?? '—'}</span>
            </p>
            <ul className="mt-2 space-y-0.5 text-orange-800">
              {refundedItems.map((i) => (
                <li key={i.id}>· Refund <strong>${i.line_total}</strong> — {i.part_number} ({i.description})</li>
              ))}
            </ul>
          </div>
        )}

        {/* Line items */}
        <h2 className="mb-2 font-bold">Items</h2>
        <div className="mb-6 overflow-x-auto rounded-md border border-border-light">
          <Table>
            <TableHeader>
              <TableRow className="border-border-light">
                <TableHead className="text-[var(--text-dark-primary)]">Part</TableHead>
                <TableHead className="text-[var(--text-dark-primary)]">Qty</TableHead>
                <TableHead className="text-[var(--text-dark-primary)]">Total</TableHead>
                <TableHead className="text-[var(--text-dark-primary)]">Status</TableHead>
                <TableHead className="text-[var(--text-dark-primary)]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <ItemRow key={item.id} item={item} busy={busy} onAction={itemAction} />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="mb-6 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-[var(--text-dark-secondary)]">Subtotal</span><span>${order.subtotal}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-dark-secondary)]">Shipping</span><span>${order.shipping}</span></div>
          <div className="flex justify-between font-bold"><span>Total paid</span><span>${order.amount_paid ?? order.total}</span></div>
        </div>

        {/* Customer + address */}
        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 font-bold">Customer</h2>
            <p className="text-sm">{order.customer_name}</p>
            <p className="text-sm text-[var(--text-dark-secondary)]">{order.customer_email}</p>
            {order.customer_phone && <p className="text-sm text-[var(--text-dark-secondary)]">{order.customer_phone}</p>}
          </div>
          <div>
            <h2 className="mb-2 font-bold">Ship to</h2>
            <p className="text-sm text-[var(--text-dark-secondary)]">{address}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 font-bold">Customer updates</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className={BTN_INACTIVE} disabled={busy || !order.items.some((item) => item.backordered)} onClick={() => customerUpdate('backorder')}>Email backorder update</Button>
            <Button variant="outline" className={BTN_INACTIVE} disabled={busy || !order.items.some((item) => item.status === 'refunded')} onClick={() => customerUpdate('refund')}>Email refund update</Button>
            <Button variant="outline" className={BTN_INACTIVE} disabled={busy} onClick={() => customerUpdate('arranged')}>Email order arranged</Button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 font-bold">Communications</h2>
          {order.messages.length === 0 ? <p className="text-sm text-[var(--text-dark-secondary)]">No emails recorded for this order yet.</p> : (
            <div className="overflow-hidden rounded-md border border-border-light">
              {order.messages.map((message) => <Link key={message.id} href={`/dashboard/messages/${message.id}`} className="block border-b border-border-light p-3 text-sm last:border-0 hover:bg-gray-50">
                <div className="flex flex-wrap justify-between gap-2"><strong>{message.subject || message.message_type.replace(/^parts_/, '').replace(/_/g, ' ')}</strong><span className={message.status === 'sent' ? 'text-green-700' : 'text-red-600'}>{message.status}</span></div>
                <div className="mt-1 text-xs text-[var(--text-dark-secondary)]">To: {message.to} · {formatDate(message.sent_at ?? message.created_at)}</div>
              </Link>)}
            </div>
          )}
        </div>

        {/* Internal notes */}
        <div className="mb-6">
          <h2 className="mb-2 font-bold">Internal notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Wholesaler chase-ups, backorder ETAs…"
            className="w-full rounded-md border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button onClick={saveOrder} disabled={busy} variant="outline" className={`mt-2 ${BTN_INACTIVE}`}>Save notes</Button>
        </div>

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

function ItemRow({ item, busy, onAction }: {
  item: AdminPartsOrderItem;
  busy: boolean;
  onAction: (itemId: number, action: ItemAction) => void;
}) {
  const btn = 'rounded border border-gray-300 px-2 py-1 text-xs hover:border-black disabled:opacity-40';
  return (
    <TableRow className="border-border-light align-top">
      <TableCell>
        <div className="font-mono text-sm">{item.part_number}</div>
        <div className="text-xs text-[var(--text-dark-secondary)]">
          {item.description}{item.colour_name ? ` · ${item.colour_name}` : ''}
        </div>
        <div className="text-xs text-[var(--text-dark-secondary)]">{item.model_name} · {item.section_code} #{item.ref_number}</div>
      </TableCell>
      <TableCell className="text-sm">{item.quantity}</TableCell>
      <TableCell className="text-sm">${item.line_total}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={
            item.status === 'refunded' ? 'border-orange-500 text-orange-600'
              : item.status === 'fulfilled' ? 'border-green-600 text-green-700'
                : 'border-gray-400 text-[var(--text-dark-primary)]'
          }>
            {item.status}
          </Badge>
          {item.backordered && (
            <span className={`text-xs font-medium ${item.backorder_overdue ? 'text-red-600' : 'text-orange-600'}`}>
              Backorder · {item.backorder_days_remaining != null
                ? (item.backorder_overdue ? `${-item.backorder_days_remaining}d overdue` : `${item.backorder_days_remaining}d left`)
                : ''}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {item.status !== 'refunded' && item.status !== 'fulfilled' && (
            <>
              {item.backordered ? (
                <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'remove_backorder')}>Remove backorder</button>
              ) : (
                <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'place_backorder')}>Place on backorder</button>
              )}
              <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'mark_fulfilled')}>Fulfilled</button>
              <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'mark_refunded')}>Refund</button>
            </>
          )}
          {(item.status === 'refunded' || item.status === 'fulfilled') && (
            <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'mark_ordered')}>Undo</button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

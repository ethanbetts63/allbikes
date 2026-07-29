'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/utils/formatting';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  adminGetPartsOrder, adminUpdatePartsOrder, adminUpdatePartsOrderItem,
  adminSendPartsCustomerUpdate,
} from '@/services/partsAdminService';
import type { AdminPartsOrder, AdminPartsOrderItem, ItemAction } from '@/types/partsAdmin';
import { BTN_INACTIVE } from '../PartsOrdersListPage';

const ORDER_STATUSES = ['pending_payment', 'paid', 'dispatched', 'completed', 'cancelled', 'refunded', 'partially_refunded'];

// Whole-row tint + legend swatch per line state, mirroring the orders list page.
// A line carries two axes — its own status and the backorder flag — but a row has
// one colour, so backorder folds into the same key. Without that a backordered
// line would look identical to an untouched one.
const ITEM_STATE_STYLE: Record<string, { row: string; swatch: string; label: string }> = {
  overdue: { row: 'bg-red-50 hover:bg-red-100', swatch: 'bg-red-400', label: 'Backorder overdue' },
  backordered: { row: 'bg-orange-50 hover:bg-orange-100', swatch: 'bg-orange-300', label: 'On backorder' },
  to_order: { row: 'bg-slate-50 hover:bg-slate-100', swatch: 'bg-slate-300', label: 'To order' },
  completed: { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Completed' },
  refunded: { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Refunded' },
};
// Accent + tint for the order status banner. Unpaid and cancelled read as
// warnings because they change what the operator is allowed to do next.
const ORDER_STATUS_BANNER: Record<string, string> = {
  pending_payment: 'border-l-amber-500 bg-amber-50 text-amber-900',
  paid: 'border-l-green-600 bg-green-50 text-green-900',
  dispatched: 'border-l-blue-500 bg-blue-50 text-blue-900',
  completed: 'border-l-emerald-600 bg-emerald-50 text-emerald-900',
  cancelled: 'border-l-red-500 bg-red-50 text-red-900',
  refunded: 'border-l-orange-500 bg-orange-50 text-orange-900',
  partially_refunded: 'border-l-orange-400 bg-orange-50 text-orange-900',
};

// Legend order = most actionable first, matching the list page's convention.
const ITEM_LEGEND_ORDER = ['overdue', 'backordered', 'to_order', 'completed', 'refunded'];

/** The single state a row is tinted by. Settled outcomes win over backorder. */
function itemState(item: AdminPartsOrderItem, daysRemaining: number): string {
  if (item.status === 'refunded' || item.status === 'completed') return item.status;
  if (item.backordered) return daysRemaining < 0 ? 'overdue' : 'backordered';
  return 'to_order';
}

/** A single outbound email the operator can trigger for this order. */
type EmailAction = {
  key: string;
  label: string;
  description: string;
  cta: string;
  disabled: boolean;
  /** Shown under the description so the operator knows why the button is greyed out. */
  disabledReason?: string;
  /** Set for emails that open a compose screen instead of sending immediately. */
  href?: string;
  onClick?: () => void;
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
  const customerUpdate = async (type: 'backorder' | 'refund' | 'arranged') => {
    const confirmationCopy = {
      backorder: 'This will send an email to the customer. This type should only be sent if one or more items in the order are on backorder.',
      refund: 'This will send an email to the customer. This type should only be sent after the relevant Stripe refund has been processed.',
      arranged: 'This will send an email to the customer. This type should only be sent once you have arranged the order with the supplier.',
    };
    if (!order || !confirm(confirmationCopy[type])) return;
    setBusy(true);
    try { await adminSendPartsCustomerUpdate(order.order_reference, type); refresh(await adminGetPartsOrder(order.order_reference)); toast.success('Customer update sent.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Customer update failed.'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-12 w-12" /></div>;
  if (!order) return <p className="p-6 text-destructive">Order not found.</p>;

  const refundedItems = order.items.filter((i) => i.status === 'refunded');
  const backorderedItems = order.items.filter((i) => i.backordered);
  const address = [order.address_line1, order.address_line2, `${order.suburb} ${order.state} ${order.postcode}`, order.country]
    .filter(Boolean).join(', ');

  // Ordered by the workflow an operator actually follows: order from the
  // supplier, confirm to the customer, then chase backorders/refunds.
  const emailActions: EmailAction[] = [
    {
      key: 'supplier',
      label: 'Supplier order',
      description: 'Sends the parts list to the wholesaler to fulfil. Opens a compose screen so you can set the recipient and review the body first.',
      cta: 'Compose',
      disabled: order.status !== 'paid',
      disabledReason: 'Only available once the order is paid.',
      href: `/dashboard/parts-orders/${order.order_reference}/supplier-email`,
    },
    {
      key: 'arranged',
      label: 'Order arranged',
      description: 'Tells the customer every part is available and shipment has been arranged with the supplier.',
      cta: 'Email',
      disabled: backorderedItems.length > 0,
      disabledReason: 'One or more items are still on backorder — resolve or refund them first.',
      onClick: () => customerUpdate('arranged'),
    },
    {
      key: 'backorder',
      label: 'Backorder update',
      description: 'Tells the customer one or more parts are on backorder and the order is being held.',
      cta: 'Email',
      disabled: !order.items.some((item) => item.backordered),
      disabledReason: 'No items are currently on backorder.',
      onClick: () => customerUpdate('backorder'),
    },
    {
      key: 'refund',
      label: 'Refund update',
      description: 'Refund for cancelled/backorder expired lines processed and remaining parts have been released. Send after refunding in Stripe.',
      cta: 'Email',
      disabled: refundedItems.length === 0,
      disabledReason: 'No items are marked refunded.',
      onClick: () => customerUpdate('refund'),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-lg bg-[var(--bg-light-primary)] p-4 text-[var(--text-dark-primary)]">
        {/* Header */}
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h1 className="font-mono text-2xl font-bold">{order.order_reference}</h1>
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

        {/* Order status — the one place the operator reads where this order
            stands, now that the header pills are gone. The colour accent does
            the attention-grabbing, so the type stays quiet. */}
        <div className={`mb-6 rounded-md border-l-4 px-4 py-3 ${ORDER_STATUS_BANNER[order.status] ?? 'border-l-gray-400 bg-gray-50 text-gray-800'}`}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xs font-medium uppercase tracking-widest opacity-70">Order status</span>
            <span className="text-xl font-semibold capitalize">
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-md border border-input bg-white px-3 text-sm text-[var(--text-dark-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <Button onClick={saveOrder} disabled={busy} variant="outline" className={BTN_INACTIVE}>Save</Button>
          </div>
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

        {/* Line items */}
        <h2 className="mb-2 font-bold">Items</h2>

        {/* Colour key */}
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-dark-secondary)]">
          <span className="font-medium text-[var(--text-dark-primary)]">Row colour:</span>
          {ITEM_LEGEND_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-3 w-3 rounded-sm ${ITEM_STATE_STYLE[s].swatch}`} />
              {ITEM_STATE_STYLE[s].label}
            </span>
          ))}
        </div>

        <div className="mb-6 overflow-x-auto rounded-md border border-border-light">
          <Table>
            <TableHeader>
              <TableRow className="border-border-light">
                <TableHead className="text-[var(--text-dark-primary)]">Part</TableHead>
                <TableHead className="text-[var(--text-dark-primary)]">Qty</TableHead>
                <TableHead className="text-[var(--text-dark-primary)]">Sold</TableHead>
                <TableHead className="text-[var(--text-dark-primary)]">Cost</TableHead>
                <TableHead className="text-[var(--text-dark-primary)]">Profit</TableHead>
                <TableHead className="text-[var(--text-dark-primary)]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  busy={busy}
                  daysRemaining={order.backorder_days_remaining}
                  windowExpired={order.backorder_window_expired}
                  holdDays={order.backorder_hold_days}
                  onAction={itemAction}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals + internal margin */}
        <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:max-w-2xl">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-[var(--text-dark-secondary)]">Subtotal</span><span>${order.subtotal}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-dark-secondary)]">Shipping</span><span>${order.shipping}</span></div>
            <div className="flex justify-between font-bold"><span>Total </span><span>${order.amount_paid ?? order.total}</span></div>
          </div>

          <div className="rounded-md border border-border-light p-3 text-sm">
            <h3 className="mb-1 font-bold">Internal margin</h3>
            <p className="mb-2 text-xs text-[var(--text-dark-secondary)]">
              Current supplier feed prices, before markup. Parts only — shipping excluded.
            </p>
            <div className="flex justify-between"><span className="text-[var(--text-dark-secondary)]">Customer parts total</span><span>${order.margin.customer_parts_total.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-dark-secondary)]">Supplier cost</span><span>${order.margin.supplier_parts_total.toFixed(2)}</span></div>
            <div className="mt-1 flex justify-between border-t border-border-light pt-1 font-bold text-emerald-700">
              <span>Gross profit</span><span>${order.margin.gross_profit_total.toFixed(2)}</span>
            </div>
            {order.margin.has_unpriced_items && (
              <p className="mt-2 text-xs text-orange-700">
                Some parts have no current supplier price — the cost and profit figures above exclude them.
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 font-bold">Send email</h2>
          <div className="overflow-x-auto rounded-md border border-border-light">
            <Table>
              <TableHeader>
                <TableRow className="border-border-light">
                  <TableHead className="text-[var(--text-dark-primary)]">Type</TableHead>
                  <TableHead className="text-[var(--text-dark-primary)]">What it does</TableHead>
                  <TableHead className="text-right text-[var(--text-dark-primary)]">Send</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailActions.map((action) => (
                  <TableRow key={action.key} className="border-border-light">
                    <TableCell className="whitespace-nowrap align-top font-medium">{action.label}</TableCell>
                    <TableCell className="align-top text-sm text-[var(--text-dark-secondary)]">
                      {action.description}
                      {action.disabled && action.disabledReason && (
                        <span className="mt-1 block text-xs italic">{action.disabledReason}</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-right">
                      {action.href && !action.disabled ? (
                        <Button asChild className="border-sky-700 bg-sky-600 text-white hover:bg-sky-700 hover:text-white">
                          <Link href={action.href}>{action.cta}</Link>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className={BTN_INACTIVE}
                          disabled={busy || action.disabled}
                          onClick={action.onClick}
                        >
                          {action.cta}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 font-bold">Communication History</h2>
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

function ItemRow({ item, busy, daysRemaining, windowExpired, holdDays, onAction }: {
  item: AdminPartsOrderItem;
  busy: boolean;
  /** Days left in the hold for the whole order; zero or negative means closed. */
  daysRemaining: number;
  windowExpired: boolean;
  holdDays: number;
  onAction: (itemId: number, action: ItemAction) => void;
}) {
  const btn = 'rounded border border-gray-300 px-2 py-1 text-xs hover:border-black disabled:opacity-40';
  const settled = item.status === 'refunded' || item.status === 'completed';
  const daysOld = holdDays - daysRemaining;
  const state = ITEM_STATE_STYLE[itemState(item, daysRemaining)];
  return (
    <TableRow className={`border-border-light align-top ${state.row}`}>
      <TableCell>
        {/* The row tint carries the state visually; this keeps it available to
            screen readers, which cannot see the colour key. */}
        <span className="sr-only">Status: {state.label}. </span>
        <div className="font-mono text-sm">{item.part_number}</div>
        <div className="text-xs text-[var(--text-dark-secondary)]">
          {item.description}{item.colour_name ? ` · ${item.colour_name}` : ''}
        </div>
        <div className="text-xs text-[var(--text-dark-secondary)]">{item.model_name} · {item.section_code} #{item.ref_number}</div>
      </TableCell>
      <TableCell className="text-sm">{item.quantity}</TableCell>
      <TableCell className="text-sm whitespace-nowrap">${item.line_total}</TableCell>
      <TableCell className="text-sm whitespace-nowrap text-[var(--text-dark-secondary)]">
        {item.supplier_line_total == null ? '—' : `$${item.supplier_line_total.toFixed(2)}`}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap font-medium text-emerald-700">
        {item.gross_profit == null ? '—' : `$${item.gross_profit.toFixed(2)}`}
      </TableCell>
      <TableCell>
        {/* The colour says "on backorder"; only the countdown carries the number,
            so it stays next to the buttons the operator is deciding between.
            A settled line has nothing left to wait for. */}
        {item.backordered && !settled && (
          <div className={`mb-1 text-xs font-medium ${daysRemaining < 0 ? 'text-red-600' : 'text-orange-600'}`}>
            {daysRemaining < 0 ? `${-daysRemaining}d overdue` : `${daysRemaining}d left`}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {!settled && (
            <>
              {item.backordered ? (
                <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'remove_backorder')}>Remove backorder</button>
              ) : (
                <button
                  className={btn}
                  disabled={busy || windowExpired}
                  onClick={() => onAction(item.id, 'place_backorder')}
                >
                  Place on backorder
                </button>
              )}
              <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'mark_refunded')}>Refund</button>
            </>
          )}
          {item.status === 'refunded' && (
            <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'mark_to_order')}>Undo</button>
          )}
        </div>
        {!settled && !item.backordered && windowExpired && (
          <p className="mt-1 w-48 whitespace-normal text-xs italic text-[var(--text-dark-secondary)]">
            Order is {daysOld}d old; exceeds the {holdDays}-day backorder window. Refund instead.
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}

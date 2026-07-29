import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { AdminPartsOrder, CustomerUpdateType } from '@/types/partsAdmin';
import { BTN_INACTIVE } from '../_lib/partsOrderStyles';

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

/**
 * Every email this order can send, with the conditions that block each one.
 *
 * The guards are duplicated on the server; these exist so the operator sees
 * *why* something is unavailable before clicking.
 */
export default function SendEmailPanel({ order, busy, onCustomerUpdate }: {
  order: AdminPartsOrder;
  busy: boolean;
  onCustomerUpdate: (type: CustomerUpdateType) => void;
}) {
  const refundedItems = order.items.filter((i) => i.status === 'refunded');
  const backorderedItems = order.items.filter((i) => i.backordered);
  const customerUpdatesDisabled = order.payment_status !== 'succeeded';

  // Ordered by the workflow an operator actually follows: order from the
  // supplier, confirm to the customer, then chase backorders/refunds.
  const actions: EmailAction[] = [
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
      disabled: customerUpdatesDisabled || backorderedItems.length > 0,
      disabledReason: customerUpdatesDisabled
        ? 'Only available after payment succeeds.'
        : 'One or more items are still on backorder — resolve or refund them first.',
      onClick: () => onCustomerUpdate('arranged'),
    },
    {
      key: 'backorder',
      label: 'Backorder update',
      description: 'Tells the customer one or more parts are on backorder and the order is being held.',
      cta: 'Email',
      disabled: customerUpdatesDisabled || backorderedItems.length === 0,
      disabledReason: customerUpdatesDisabled
        ? 'Only available after payment succeeds.'
        : 'No items are currently on backorder.',
      onClick: () => onCustomerUpdate('backorder'),
    },
    {
      key: 'refund',
      label: 'Refund update',
      description: 'Refund for cancelled/backorder expired lines processed and remaining parts have been released. Send after refunding in Stripe.',
      cta: 'Email',
      disabled: customerUpdatesDisabled || refundedItems.length === 0,
      disabledReason: customerUpdatesDisabled
        ? 'Only available after payment succeeds.'
        : 'No items are marked refunded.',
      onClick: () => onCustomerUpdate('refund'),
    },
  ];

  return (
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
            {actions.map((action) => (
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
  );
}

import type { AdminPartsOrderItem } from '@/app/dashboard/parts-orders/_lib/partsAdmin';

/**
 * Stripe refunds are processed by hand, so a line marked refunded here is a
 * standing instruction to go and do it. Renders nothing when there is none.
 */
export default function RefundsToProcess({ items, paymentIntentId }: {
  items: AdminPartsOrderItem[];
  paymentIntentId: string | null;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6 rounded-md border border-orange-400 bg-orange-50 p-4 text-sm">
      <p className="font-bold text-orange-800">Refunds to process in Stripe</p>
      <p className="mt-1 text-orange-700">
        Payment intent: <span className="font-mono">{paymentIntentId ?? '—'}</span>
      </p>
      <ul className="mt-2 space-y-0.5 text-orange-800">
        {items.map((item) => (
          <li key={item.id}>
            · Refund <strong>${item.line_total}</strong> — {item.part_number} ({item.description})
          </li>
        ))}
      </ul>
    </div>
  );
}

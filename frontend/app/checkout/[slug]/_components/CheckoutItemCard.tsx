import type { CheckoutItemSummary } from '@/types/CheckoutItemSummary';
import type { CheckoutType } from '../_lib/checkout';

/** What the customer is about to pay for, shown above the form. */
export default function CheckoutItemCard({ summary, checkoutType, brand, selectedColour }: {
  summary: CheckoutItemSummary;
  checkoutType: CheckoutType;
  /** Product brand, shown as the eyebrow on product checkouts. */
  brand?: string | null;
  selectedColour: string | null;
}) {
  const isDeposit = checkoutType === 'deposit';
  return (
    <div className="bg-[var(--bg-light-secondary)] border border-border-light rounded-lg p-4 mb-8 flex items-center gap-4">
      {summary.imageUrl && (
        <img src={summary.imageUrl} alt={summary.name} className="w-20 h-20 object-cover rounded-md shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {isDeposit && (
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">
            Deposit Reservation
          </p>
        )}
        {!isDeposit && brand && (
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">
            {brand}
          </p>
        )}
        <p className="font-bold text-[var(--text-dark-primary)] truncate">{summary.name}</p>
        {isDeposit && selectedColour && (
          <p className="text-sm font-medium text-[var(--text-dark-primary)]">Colour: {selectedColour}</p>
        )}
        <p className="text-sm text-[var(--text-dark-secondary)]">{summary.priceLabel}</p>
      </div>
    </div>
  );
}

import { Checkbox } from '@/components/ui/checkbox';
import type { HireExtra } from '@/types/HireBooking';

/** Optional add-ons, priced per day. Renders nothing when none are defined. */
export default function ExtrasPicker({ extras, selected, onToggle }: {
  extras: HireExtra[];
  selected: Record<number, boolean>;
  onToggle: (extraId: number, checked: boolean) => void;
}) {
  if (extras.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-3">
        Add Extras
      </h2>
      <div className="space-y-2">
        {extras.map(extra => (
          <label
            key={extra.id}
            className="flex items-center justify-between gap-3 bg-[var(--bg-light-secondary)] border border-[var(--border-light)] rounded-lg px-4 py-3 cursor-pointer hover:border-[var(--text-dark-secondary)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={!!selected[extra.id]}
                onCheckedChange={(checked) => onToggle(extra.id, !!checked)}
              />
              <span className="text-sm font-medium text-[var(--text-dark-primary)]">{extra.name}</span>
            </div>
            <span className="text-sm text-[var(--text-dark-secondary)] shrink-0">
              ${parseFloat(extra.price_per_day).toFixed(2)}/day
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

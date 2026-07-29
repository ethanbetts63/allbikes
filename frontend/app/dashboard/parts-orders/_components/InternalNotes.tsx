import { Button } from '@/components/ui/button';
import { BTN_INACTIVE } from '../_lib/partsOrderStyles';

/** Staff-only scratchpad. Saved through the same endpoint as the order status. */
export default function InternalNotes({ notes, busy, onChange, onSave }: {
  notes: string;
  busy: boolean;
  onChange: (notes: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 font-bold">Internal notes</h2>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Wholesaler chase-ups, backorder ETAs…"
        className="w-full rounded-md border border-input bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <Button onClick={onSave} disabled={busy} variant="outline" className={`mt-2 ${BTN_INACTIVE}`}>
        Save notes
      </Button>
    </div>
  );
}

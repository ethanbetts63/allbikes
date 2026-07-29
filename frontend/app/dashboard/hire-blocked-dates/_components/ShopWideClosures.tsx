import { Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import { formatDateRange } from '../_lib/blockedDates';

/** Closures with no motorcycle attached — the whole shop is unavailable. */
export default function ShopWideClosures({ blocks, onDelete }: {
  blocks: HireBlockedDate[];
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Shop-Wide Closures</CardTitle>
      </CardHeader>
      <CardContent>
        {blocks.length === 0 ? (
          <p className="text-sm text-[var(--text-dark-secondary)]">No shop-wide closures.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-light)]">
            {blocks.map(b => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-dark-primary)]">
                    {formatDateRange(b.date_from, b.date_to)}
                  </p>
                  {b.reason && <p className="text-xs text-[var(--text-dark-secondary)] mt-0.5">{b.reason}</p>}
                </div>
                <button onClick={() => onDelete(b.id)} className="text-destructive hover:opacity-70 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

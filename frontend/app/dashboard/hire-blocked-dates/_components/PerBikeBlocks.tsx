import { Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Bike } from '@/types/Bike';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import { getPrimaryVehicleImage } from '@/utils/vehicleImages';
import { formatDateRange } from '../_lib/blockedDates';

/** Closures scoped to a single bike; the rest of the fleet stays bookable. */
export default function PerBikeBlocks({ blocks, bikes, onDelete }: {
  blocks: HireBlockedDate[];
  bikes: Bike[];
  onDelete: (id: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-Bike Blocks</CardTitle>
      </CardHeader>
      <CardContent>
        {blocks.length === 0 ? (
          <p className="text-sm text-[var(--text-dark-secondary)]">No per-bike blocks.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-light)]">
            {blocks.map(b => {
              const bike = bikes.find(bk => bk.id === b.motorcycle);
              const thumb = getPrimaryVehicleImage(bike?.images, 'thumbnail');
              return (
                <li key={b.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {thumb && (
                      <img src={thumb} alt={b.motorcycle_name ?? ''} className="h-10 w-14 object-contain rounded shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-dark-primary)] truncate">{b.motorcycle_name}</p>
                      <p className="text-xs text-[var(--text-dark-secondary)]">
                        {formatDateRange(b.date_from, b.date_to)}
                      </p>
                      {b.reason && <p className="text-xs text-[var(--text-dark-secondary)] mt-0.5">{b.reason}</p>}
                    </div>
                  </div>
                  <button onClick={() => onDelete(b.id)} className="text-destructive hover:opacity-70 p-1 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

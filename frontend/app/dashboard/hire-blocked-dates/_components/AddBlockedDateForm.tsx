import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Bike } from '@/types/Bike';
import { getPrimaryVehicleImage } from '@/utils/vehicleImages';
import { bikeLabel } from '../_lib/blockedDates';

export type NewBlockedDate = {
  date_from: string;
  date_to: string;
  reason?: string;
  motorcycle: number | null;
};

/**
 * Adds one closure. Leaving the motorcycle blank blocks the whole shop, which
 * is why the field says so rather than defaulting to a bike.
 */
export default function AddBlockedDateForm({ bikes, isSaving, onAdd }: {
  bikes: Bike[];
  isSaving: boolean;
  onAdd: (values: NewBlockedDate) => Promise<boolean>;
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reason, setReason] = useState('');
  const [motorcycleId, setMotorcycleId] = useState('');

  const selectedBike = motorcycleId
    ? bikes.find((b) => b.id === parseInt(motorcycleId)) ?? null
    : null;

  const submit = async () => {
    if (!dateFrom || !dateTo) return;
    const added = await onAdd({
      date_from: dateFrom,
      date_to: dateTo,
      reason: reason.trim() || undefined,
      motorcycle: motorcycleId ? parseInt(motorcycleId) : null,
    });
    if (!added) return;
    setDateFrom('');
    setDateTo('');
    setReason('');
    setMotorcycleId('');
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Add Blocked Date</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_from">From</Label>
            <Input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={e => {
                setDateFrom(e.target.value);
                if (dateTo && e.target.value > dateTo) setDateTo('');
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_to">To</Label>
            <Input id="date_to" type="date" min={dateFrom} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input id="reason" placeholder="e.g. Easter holiday" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motorcycle">Motorcycle (leave blank for shop-wide closure)</Label>
            <select
              id="motorcycle"
              value={motorcycleId}
              onChange={e => setMotorcycleId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Shop-wide closure —</option>
              {bikes.map(bike => (
                <option key={bike.id} value={bike.id}>{bikeLabel(bike)}</option>
              ))}
            </select>

            {/* A native <option> can't show a thumbnail, so the choice is
                echoed underneath the select instead. */}
            {selectedBike && (
              <BikePreview bike={selectedBike} />
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={isSaving || !dateFrom || !dateTo}>
            {isSaving ? 'Adding...' : 'Add Blocked Date'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BikePreview({ bike }: { bike: Bike }) {
  const thumb = getPrimaryVehicleImage(bike.images, 'thumbnail');
  const name = bikeLabel(bike);
  return (
    <div className="flex items-center gap-3 mt-2 p-2 bg-[var(--bg-light-secondary)] rounded-md border border-[var(--border-light)]">
      {thumb && <img src={thumb} alt={name} className="h-12 w-16 object-contain rounded" />}
      <span className="text-sm font-medium text-[var(--text-dark-primary)]">{name}</span>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { adminGetHireBlockedDates, adminCreateHireBlockedDate, adminDeleteHireBlockedDate, getHireBikes } from '@/api';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import type { Bike } from '@/types/Bike';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';

const AdminHireBlockedDatesPage = () => {
  const [blockedDates, setBlockedDates] = useState<HireBlockedDate[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reason, setReason] = useState('');
  const [motorcycleId, setMotorcycleId] = useState<string>('');

  useEffect(() => {
    Promise.all([adminGetHireBlockedDates(), getHireBikes()])
      .then(([blocked, hireBikes]) => {
        setBlockedDates(blocked);
        setBikes(hireBikes);
      })
      .catch(() => setNotification({ message: 'Failed to load data.', type: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!dateFrom || !dateTo) return;
    setIsSaving(true);
    setNotification(null);
    try {
      const created = await adminCreateHireBlockedDate({
        date_from: dateFrom,
        date_to: dateTo,
        reason: reason.trim() || undefined,
        motorcycle: motorcycleId ? parseInt(motorcycleId) : null,
      });
      setBlockedDates(prev => [...prev, created].sort((a, b) => a.date_from.localeCompare(b.date_from)));
      setDateFrom('');
      setDateTo('');
      setReason('');
      setMotorcycleId('');
      setNotification({ message: 'Blocked date added.', type: 'success' });
    } catch {
      setNotification({ message: 'Failed to add blocked date.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminDeleteHireBlockedDate(id);
      setBlockedDates(prev => prev.filter(b => b.id !== id));
    } catch {
      setNotification({ message: 'Failed to delete.', type: 'error' });
    }
  };

  const formatDateRange = (from: string, to: string) => {
    const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
  };

  const globalBlocks = blockedDates.filter(b => !b.motorcycle);
  const bikeBlocks = blockedDates.filter(b => b.motorcycle);

  if (isLoading) return <div className="p-6 text-[var(--text-dark-secondary)]">Loading...</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Blocked Dates</h1>

      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Add form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add Blocked Date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_from">From</Label>
              <Input id="date_from" type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); if (dateTo && e.target.value > dateTo) setDateTo(''); }} />
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
                {bikes.map(bike => {
                  const name = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
                  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
                  const thumb = sortedImages[0]?.thumbnail || sortedImages[0]?.image;
                  return (
                    <option key={bike.id} value={bike.id}>
                      {thumb ? '' : ''}{name}
                    </option>
                  );
                })}
              </select>
              {/* Bike preview */}
              {motorcycleId && (() => {
                const bike = bikes.find(b => b.id === parseInt(motorcycleId));
                if (!bike) return null;
                const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
                const thumb = sortedImages[0]?.thumbnail || sortedImages[0]?.image;
                const name = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
                return (
                  <div className="flex items-center gap-3 mt-2 p-2 bg-[var(--bg-light-secondary)] rounded-md border border-[var(--border-light)]">
                    {thumb && <img src={thumb} alt={name} className="h-12 w-16 object-contain rounded" />}
                    <span className="text-sm font-medium text-[var(--text-dark-primary)]">{name}</span>
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAdd} disabled={isSaving || !dateFrom || !dateTo}>
              {isSaving ? 'Adding...' : 'Add Blocked Date'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Global blocks */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shop-Wide Closures</CardTitle>
        </CardHeader>
        <CardContent>
          {globalBlocks.length === 0 ? (
            <p className="text-sm text-[var(--text-dark-secondary)]">No shop-wide closures.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-light)]">
              {globalBlocks.map(b => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-dark-primary)]">{formatDateRange(b.date_from, b.date_to)}</p>
                    {b.reason && <p className="text-xs text-[var(--text-dark-secondary)] mt-0.5">{b.reason}</p>}
                  </div>
                  <button onClick={() => handleDelete(b.id)} className="text-destructive hover:opacity-70 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Per-bike blocks */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Bike Blocks</CardTitle>
        </CardHeader>
        <CardContent>
          {bikeBlocks.length === 0 ? (
            <p className="text-sm text-[var(--text-dark-secondary)]">No per-bike blocks.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-light)]">
              {bikeBlocks.map(b => {
                const bike = bikes.find(bk => bk.id === b.motorcycle);
                const sortedImages = bike ? [...bike.images].sort((a, b) => a.order - b.order) : [];
                const thumb = sortedImages[0]?.thumbnail || sortedImages[0]?.image;
                return (
                  <li key={b.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {thumb && <img src={thumb} alt={b.motorcycle_name ?? ''} className="h-10 w-14 object-contain rounded shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-dark-primary)] truncate">{b.motorcycle_name}</p>
                        <p className="text-xs text-[var(--text-dark-secondary)]">{formatDateRange(b.date_from, b.date_to)}</p>
                        {b.reason && <p className="text-xs text-[var(--text-dark-secondary)] mt-0.5">{b.reason}</p>}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(b.id)} className="text-destructive hover:opacity-70 p-1 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHireBlockedDatesPage;

import { useState, useEffect } from 'react';
import { adminGetHireExtras, adminCreateHireExtra, adminUpdateHireExtra, adminDeleteHireExtra } from '@/api';
import type { HireExtra } from '@/types/HireBooking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

const AdminHireExtrasPage = () => {
  const [extras, setExtras] = useState<HireExtra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New extra form state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    adminGetHireExtras()
      .then(setExtras)
      .catch(() => setNotification({ message: 'Failed to load extras.', type: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newPrice) return;
    setIsCreating(true);
    try {
      const created = await adminCreateHireExtra({ name: newName.trim(), price_per_day: newPrice, is_active: true });
      setExtras(prev => [...prev, created]);
      setNewName('');
      setNewPrice('');
    } catch {
      setNotification({ message: 'Failed to create extra.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (extra: HireExtra) => {
    try {
      const updated = await adminUpdateHireExtra(extra.id, { is_active: !extra.is_active });
      setExtras(prev => prev.map(e => e.id === extra.id ? updated : e));
    } catch {
      setNotification({ message: 'Failed to update extra.', type: 'error' });
    }
  };

  const handleDelete = async (extra: HireExtra) => {
    if (!window.confirm(`Delete "${extra.name}"?`)) return;
    try {
      await adminDeleteHireExtra(extra.id);
      setExtras(prev => prev.filter(e => e.id !== extra.id));
    } catch {
      setNotification({ message: 'Failed to delete extra.', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Hire Extras</h1>

      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Add new extra */}
      <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3 text-[var(--text-dark-secondary)] uppercase tracking-wide">Add Extra</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-[var(--text-dark-secondary)]">Name</label>
            <Input
              placeholder="e.g. Helmet"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div className="w-36 space-y-1">
            <label className="text-xs text-[var(--text-dark-secondary)]">Price per day (AUD)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={isCreating || !newName.trim() || !newPrice}>
            {isCreating ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </div>

      {/* Extras list */}
      {extras.length === 0 ? (
        <p className="text-[var(--text-dark-secondary)] text-sm">No extras defined yet.</p>
      ) : (
        <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-light-secondary)] border-b border-[var(--border-light)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-dark-secondary)] uppercase tracking-wide text-xs">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-dark-secondary)] uppercase tracking-wide text-xs">Price / Day</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-dark-secondary)] uppercase tracking-wide text-xs">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {extras.map(extra => (
                <tr key={extra.id} className="border-b border-[var(--border-light)] last:border-0">
                  <td className="px-4 py-3 text-[var(--text-dark-primary)] font-medium">{extra.name}</td>
                  <td className="px-4 py-3 text-[var(--text-dark-primary)]">${parseFloat(extra.price_per_day).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(extra)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
                        extra.is_active
                          ? 'border-green-600 text-green-700 hover:bg-red-50 hover:border-red-500 hover:text-destructive'
                          : 'border-gray-400 text-[var(--text-dark-secondary)] hover:border-green-600 hover:text-green-700'
                      }`}
                    >
                      {extra.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(extra)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminHireExtrasPage;

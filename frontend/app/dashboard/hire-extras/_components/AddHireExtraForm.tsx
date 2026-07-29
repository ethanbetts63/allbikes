import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Adds one extra. Clears itself only once the create succeeds. */
export default function AddHireExtraForm({ isCreating, onCreate }: {
  isCreating: boolean;
  onCreate: (values: { name: string; pricePerDay: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const submit = async () => {
    if (!name.trim() || !price) return;
    const created = await onCreate({ name: name.trim(), pricePerDay: price });
    if (!created) return;
    setName('');
    setPrice('');
  };

  return (
    <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg p-4 mb-6">
      <h2 className="text-sm font-semibold mb-3 text-[var(--text-dark-secondary)] uppercase tracking-wide">
        Add Extra
      </h2>
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-[var(--text-dark-secondary)]">Name</label>
          <Input placeholder="e.g. Helmet" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="w-36 space-y-1">
          <label className="text-xs text-[var(--text-dark-secondary)]">Price per day (AUD)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </div>
        <Button onClick={submit} disabled={isCreating || !name.trim() || !price}>
          {isCreating ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import {
  adminGetHireExtras, adminCreateHireExtra, adminUpdateHireExtra, adminDeleteHireExtra,
} from '@/api';
import type { HireExtra } from '@/types/HireBooking';
import { Spinner } from '@/components/ui/spinner';
import AddHireExtraForm from './_components/AddHireExtraForm';
import HireExtrasTable from './_components/HireExtrasTable';

export default function AdminHireExtrasPage() {
  const [extras, setExtras] = useState<HireExtra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminGetHireExtras()
      .then((data) => { if (!cancelled) setExtras(data); })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load extras.');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  /** Resolves true when created, so the form knows to clear. */
  const handleCreate = async ({ name, pricePerDay }: { name: string; pricePerDay: string }) => {
    setIsCreating(true);
    try {
      const created = await adminCreateHireExtra({
        name, price_per_day: pricePerDay, is_active: true,
      });
      setExtras(prev => [...prev, created]);
      return true;
    } catch {
      toast.error('Failed to create extra.');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (extra: HireExtra) => {
    try {
      const updated = await adminUpdateHireExtra(extra.id, { is_active: !extra.is_active });
      setExtras(prev => prev.map(e => (e.id === extra.id ? updated : e)));
    } catch {
      toast.error('Failed to update extra.');
    }
  };

  const handleDelete = async (extra: HireExtra) => {
    if (!window.confirm(`Delete "${extra.name}"?`)) return;
    try {
      await adminDeleteHireExtra(extra.id);
      setExtras(prev => prev.filter(e => e.id !== extra.id));
    } catch {
      toast.error('Failed to delete extra.');
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

      <AddHireExtraForm isCreating={isCreating} onCreate={handleCreate} />
      <HireExtrasTable extras={extras} onToggleActive={handleToggleActive} onDelete={handleDelete} />
    </div>
  );
}

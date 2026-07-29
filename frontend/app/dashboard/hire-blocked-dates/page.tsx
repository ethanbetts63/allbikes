'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import {
  adminGetHireBlockedDates, adminCreateHireBlockedDate, adminDeleteHireBlockedDate, getHireBikes,
} from '@/api';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import type { Bike } from '@/types/Bike';
import AddBlockedDateForm, { type NewBlockedDate } from './_components/AddBlockedDateForm';
import PerBikeBlocks from './_components/PerBikeBlocks';
import ShopWideClosures from './_components/ShopWideClosures';

export default function AdminHireBlockedDatesPage() {
  const [blockedDates, setBlockedDates] = useState<HireBlockedDate[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminGetHireBlockedDates(), getHireBikes()])
      .then(([blocked, hireBikes]) => {
        if (cancelled) return;
        setBlockedDates(blocked);
        setBikes(hireBikes);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load data.');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  /** Resolves true when the block was created, so the form knows to clear. */
  const handleAdd = async (values: NewBlockedDate) => {
    setIsSaving(true);
    try {
      const created = await adminCreateHireBlockedDate(values);
      setBlockedDates(prev =>
        [...prev, created].sort((a, b) => a.date_from.localeCompare(b.date_from)));
      toast.success('Blocked date added.');
      return true;
    } catch {
      toast.error('Failed to add blocked date.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminDeleteHireBlockedDate(id);
      setBlockedDates(prev => prev.filter(b => b.id !== id));
    } catch {
      toast.error('Failed to delete.');
    }
  };

  if (isLoading) return <div className="p-6 text-[var(--text-dark-secondary)]">Loading...</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Blocked Dates</h1>

      <AddBlockedDateForm bikes={bikes} isSaving={isSaving} onAdd={handleAdd} />

      <ShopWideClosures
        blocks={blockedDates.filter(b => !b.motorcycle)}
        onDelete={handleDelete}
      />

      <PerBikeBlocks
        blocks={blockedDates.filter(b => b.motorcycle)}
        bikes={bikes}
        onDelete={handleDelete}
      />
    </div>
  );
}

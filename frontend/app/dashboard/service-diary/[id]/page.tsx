'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { adminGetBooking, adminUpdateBooking, adminDeleteBooking } from '@/api';
import type { Booking, BookingInput } from '@/types/Booking';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import BackToDiaryLink from '../_components/BackToDiaryLink';
import BookingFormCard from '../_components/BookingFormCard';
import { DIARY_PATH, bookingToInput, canSaveBooking } from '../_lib/diary';

export default function AdminBookingDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [value, setValue] = useState<BookingInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminGetBooking(bookingId)
      .then(b => {
        if (cancelled) return;
        setBooking(b);
        setValue(bookingToInput(b));
      })
      .catch(() => { if (!cancelled) setError('Failed to load booking.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bookingId]);

  const handleSave = async () => {
    if (!value) return;
    if (!canSaveBooking(value)) {
      setError('A drop-off date and customer name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await adminUpdateBooking(bookingId, value);
      setBooking(updated);
      setValue(bookingToInput(updated));
      setSuccess('Booking saved.');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to save booking.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this booking? This cannot be undone.')) return;
    try {
      await adminDeleteBooking(bookingId);
      router.push(DIARY_PATH);
    } catch {
      setError('Failed to delete booking.');
    }
  };

  if (loading) return <div className="p-6 text-[var(--text-dark-secondary)]">Loading…</div>;
  if (!booking || !value) {
    return <div className="p-6 text-destructive">{error ?? 'Booking not found.'}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <BackToDiaryLink />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">{success}</div>
      )}

      <BookingFormCard
        title="Edit Booking"
        value={value}
        onChange={setValue}
        headerExtra={
          <Badge variant="outline" className="text-[var(--text-dark-secondary)] border-gray-400">
            {booking.source_display}
          </Badge>
        }
        footerLeft={
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-destructive hover:bg-red-50 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        }
        footerRight={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        }
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { adminGetBooking, adminUpdateBooking, adminDeleteBooking } from '@/api';
import type { Booking, BookingInput } from '@/types/Booking';
import BookingForm from '@/forms/BookingForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const toInput = (b: Booking): BookingInput => ({
  drop_off_date: b.drop_off_date,
  drop_off_time: b.drop_off_time ? b.drop_off_time.slice(0, 5) : null,
  customer_name: b.customer_name,
  customer_phone: b.customer_phone,
  customer_email: b.customer_email,
  bike_name: b.bike_name,
  registration: b.registration,
  job_description: b.job_description,
  status: b.status,
});

const AdminBookingDetailPage = () => {
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
    adminGetBooking(bookingId)
      .then(b => { setBooking(b); setValue(toInput(b)); })
      .catch(() => setError('Failed to load booking.'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleSave = async () => {
    if (!value) return;
    if (!value.drop_off_date || !value.customer_name.trim()) {
      setError('A drop-off date and customer name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await adminUpdateBooking(bookingId, value);
      setBooking(updated);
      setValue(toInput(updated));
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
      router.push('/dashboard/service-diary');
    } catch {
      setError('Failed to delete booking.');
    }
  };

  if (loading) return <div className="p-6 text-[var(--text-dark-secondary)]">Loading…</div>;
  if (!booking || !value) return <div className="p-6 text-destructive">{error ?? 'Booking not found.'}</div>;

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => router.push('/dashboard/service-diary')}
        className="flex items-center gap-1 text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to diary
      </button>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4">{success}</div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Edit Booking</CardTitle>
            <Badge variant="outline" className="text-[var(--text-dark-secondary)] border-gray-400">
              {booking.source_display}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <BookingForm value={value} onChange={setValue} />
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleDelete} className="text-destructive hover:bg-red-50 hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminBookingDetailPage;

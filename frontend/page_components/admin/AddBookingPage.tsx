"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { adminCreateBooking } from '@/api';
import type { BookingInput } from '@/types/Booking';
import BookingForm from '@/forms/BookingForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const emptyBooking: BookingInput = {
  drop_off_date: '',
  drop_off_time: null,
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  bike_name: '',
  registration: '',
  job_description: '',
  status: 'not_started',
};

const AddBookingPage = () => {
  const router = useRouter();
  const [value, setValue] = useState<BookingInput>(emptyBooking);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = value.drop_off_date && value.customer_name.trim();

  const handleSave = async () => {
    if (!canSave) {
      setError('A drop-off date and customer name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminCreateBooking(value);
      router.push('/dashboard/service-diary');
    } catch {
      setError('Failed to create booking.');
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <button
        onClick={() => router.push('/dashboard/service-diary')}
        className="flex items-center gap-1 text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to diary
      </button>

      <h1 className="text-2xl font-bold text-[var(--text-dark-primary)] mb-4">Add Booking</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <BookingForm value={value} onChange={setValue} />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => router.push('/dashboard/service-diary')} className="text-[var(--text-dark-primary)]">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !canSave}>
              {saving ? 'Saving…' : 'Create Booking'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBookingPage;

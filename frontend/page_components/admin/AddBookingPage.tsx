"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { adminCreateBooking } from '@/api';
import type { BookingInput } from '@/types/Booking';
import BookingForm from '@/forms/BookingForm';
import { DIARY_PATH, diaryWeekHref } from '@/page_components/admin/AdminServiceDiaryPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const emptyBooking: BookingInput = {
  drop_off_date: '',
  drop_off_time: null,
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  street_address: '',
  suburb: '',
  postcode: '',
  registration: '',
  make: '',
  model: '',
  year: '',
  odometer: '',
  job_description: '',
  status: 'accepted',
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
      const created = await adminCreateBooking(value);
      // Land on the week the job was booked into, not whichever week is current.
      router.push(diaryWeekHref(created.drop_off_date));
    } catch {
      setError('Failed to create booking.');
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => router.push(DIARY_PATH)}
        className="flex items-center gap-1 text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to diary
      </button>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <BookingForm value={value} onChange={setValue} />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? 'Saving…' : 'Create Booking'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AddBookingPage;

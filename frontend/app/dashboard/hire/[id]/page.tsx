'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  adminGetHireBooking, adminUpdateHireBookingStatus, adminDeleteHireBooking, adminDownloadHireContract,
} from '@/api';
import type { HireBooking } from '@/types/HireBooking';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HireBookingCustomer from '../_components/HireBookingCustomer';
import HireBookingDetails from '../_components/HireBookingDetails';
import HireBookingHeader from '../_components/HireBookingHeader';

export default function AdminHireDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<HireBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    adminGetHireBooking(Number(id))
      .then(data => {
        if (cancelled) return;
        setBooking(data);
        setSelectedStatus(data.status);
      })
      .catch(() => {
        if (!cancelled) setNotification({ message: 'Failed to load booking.', type: 'error' });
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    if (!booking || !window.confirm(`Delete booking ${booking.booking_reference}? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await adminDeleteHireBooking(booking.id);
      router.push('/dashboard/hire');
    } catch {
      setNotification({ message: 'Failed to delete booking.', type: 'error' });
      setIsDeleting(false);
    }
  };

  const handleDownloadContract = async () => {
    if (!booking) return;
    setIsDownloading(true);
    try {
      const blob = await adminDownloadHireContract(booking.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${booking.booking_reference}_contract.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setNotification({ message: 'Failed to download contract.', type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!booking) return;
    setIsSaving(true);
    try {
      const updated = await adminUpdateHireBookingStatus(booking.id, selectedStatus);
      setBooking(updated);
      setNotification({ message: 'Booking updated.', type: 'success' });
    } catch {
      setNotification({ message: 'Failed to update booking.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (!booking) {
    return <p className="p-4 text-destructive">Booking not found.</p>;
  }

  return (
    <div className="p-4 md:p-6">
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] p-4 rounded-lg">
        <HireBookingHeader
          booking={booking}
          selectedStatus={selectedStatus}
          isSaving={isSaving}
          isDeleting={isDeleting}
          isDownloading={isDownloading}
          onStatusChange={setSelectedStatus}
          onUpdate={handleStatusUpdate}
          onDownloadContract={handleDownloadContract}
          onDelete={handleDelete}
        />

        <HireBookingDetails booking={booking} />
        <HireBookingCustomer booking={booking} />

        <Link
          href="/dashboard/hire"
          className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
        >
          ← Back to Hire Bookings
        </Link>
      </div>
    </div>
  );
}

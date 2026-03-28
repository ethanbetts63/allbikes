import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminGetHireBooking, adminUpdateHireBookingStatus, adminDeleteHireBooking } from '@/api';
import type { HireBooking } from '@/types/HireBooking';
import { formatDate } from '@/utils/formatting';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'border-amber-500 text-[var(--highlight)]' },
  confirmed:       { label: 'Confirmed',       className: 'border-green-600 text-green-700' },
  active:          { label: 'Active',          className: 'border-blue-500 text-blue-700' },
  returned:        { label: 'Returned',        className: 'text-[var(--text-dark-secondary)] border-gray-400' },
  cancelled:       { label: 'Cancelled',       className: 'border-red-500 text-destructive' },
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
    <span className="text-[var(--text-dark-primary)] font-semibold text-sm w-40 shrink-0">{label}</span>
    <span className="text-[var(--text-dark-secondary)] text-sm text-right">{value}</span>
  </div>
);

const AdminHireDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<HireBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!id) return;
    adminGetHireBooking(Number(id))
      .then(data => {
        setBooking(data);
        setSelectedStatus(data.status);
        setNotes(data.notes);
      })
      .catch(() => setNotification({ message: 'Failed to load booking.', type: 'error' }))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!booking || !window.confirm(`Delete booking ${booking.booking_reference}? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await adminDeleteHireBooking(booking.id);
      navigate('/dashboard/hire');
    } catch {
      setNotification({ message: 'Failed to delete booking.', type: 'error' });
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!booking) return;
    setIsSaving(true);
    try {
      const updated = await adminUpdateHireBookingStatus(booking.id, selectedStatus, notes);
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

  const badge = STATUS_BADGE[booking.status];
  const days = Math.ceil(
    (new Date(booking.hire_end).getTime() - new Date(booking.hire_start).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-4 md:p-6">
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] p-4 rounded-lg">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold font-mono mb-1">{booking.booking_reference}</h1>
            {badge && (
              <Badge variant="outline" className={`text-sm px-3 py-1 ${badge.className}`}>{badge.label}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button onClick={handleStatusUpdate} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Update'}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Hire Details */}
        <div className="mb-6">
          <h2 className="font-bold mb-2">Hire Details</h2>
          <Row label="Motorcycle" value={booking.motorcycle_name} />
          <Row label="Start Date" value={booking.hire_start} />
          <Row label="End Date" value={booking.hire_end} />
          <Row label="Duration" value={`${days} day${days !== 1 ? 's' : ''}`} />
          <Row label="Daily Rate" value={`$${parseFloat(booking.effective_daily_rate).toFixed(2)}`} />
          <Row label="Hire Total" value={`$${parseFloat(booking.total_hire_amount).toFixed(2)}`} />
          <Row label="Bond" value={`$${parseFloat(booking.bond_amount).toFixed(2)}`} />
          <Row label="Booked" value={formatDate(booking.created_at)} />
        </div>

        {/* Customer */}
        <div className="mb-6">
          <h2 className="font-bold mb-2">Customer</h2>
          <Row label="Name" value={booking.customer_name} />
          <Row label="Email" value={booking.customer_email} />
          <Row label="Phone" value={booking.customer_phone} />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <h2 className="font-bold mb-2">Internal Notes</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            placeholder="Add notes visible only to admin..."
          />
        </div>

        <Link to="/dashboard/hire" className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2">
          ← Back to Hire Bookings
        </Link>

      </div>
    </div>
  );
};

export default AdminHireDetailPage;

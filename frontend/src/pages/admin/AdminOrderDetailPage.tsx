import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetOrder, adminUpdateOrderStatus } from '@/api';
import type { Order } from '@/types/Order';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid',            label: 'Paid' },
  { value: 'dispatched',      label: 'Dispatched' },
  { value: 'delivered',       label: 'Delivered' },
  { value: 'cancelled',       label: 'Cancelled' },
  { value: 'refunded',        label: 'Refunded' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'border-amber-500 text-amber-600' },
  paid:            { label: 'Paid',            className: 'border-green-600 text-green-700' },
  dispatched:      { label: 'Dispatched',      className: 'border-blue-500 text-blue-600' },
  delivered:       { label: 'Delivered',       className: 'text-gray-500 border-gray-400' },
  cancelled:       { label: 'Cancelled',       className: 'border-red-500 text-red-600' },
  refunded:        { label: 'Refunded',        className: 'border-orange-500 text-orange-600' },
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
    <span className="text-black font-semibold text-sm w-36 shrink-0">{label}</span>
    <span className="text-gray-600 text-sm text-right">{value}</span>
  </div>
);

const AdminOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const data = await adminGetOrder(Number(id));
        setOrder(data);
        setSelectedStatus(data.status);
      } catch {
        setNotification({ message: 'Failed to load order.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order || selectedStatus === order.status) return;
    setIsSaving(true);
    try {
      await adminUpdateOrderStatus(order.id, selectedStatus);
      setOrder({ ...order, status: selectedStatus });
      setNotification({ message: 'Status updated.', type: 'success' });
    } catch {
      setNotification({ message: 'Failed to update status.', type: 'error' });
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

  if (!order) {
    return <p className="text-red-500">Order not found.</p>;
  }

  const badge = STATUS_BADGE[order.status];
  const displayPrice = order.amount_paid ?? '0';

  const address = [
    order.address_line1,
    order.address_line2,
    `${order.suburb} ${order.state} ${order.postcode}`,
  ].filter(Boolean).join(', ');

  return (
    <div>
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-white text-black p-4 rounded-lg">

        {/* Header: reference, badge, status update */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-black font-mono mb-1">{order.order_reference}</h1>
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
            <Button
              onClick={handleStatusUpdate}
              disabled={isSaving || selectedStatus === order.status}
            >
              {isSaving ? 'Saving...' : 'Update Status'}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-black font-bold mb-2">Order Details</h2>
          <Row label="Product" value={order.product_name} />
          <Row label="Price" value={`$${parseFloat(displayPrice).toLocaleString()} incl. GST`} />
          <Row label="Placed" value={new Date(order.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} />
          <Row label="Last Updated" value={new Date(order.updated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} />
        </div>

        <div className="mb-6">
          <h2 className="text-black font-bold mb-2">Customer</h2>
          <Row label="Name" value={order.customer_name} />
          <Row label="Email" value={order.customer_email} />
          {order.customer_phone && <Row label="Phone" value={order.customer_phone} />}
        </div>

        <div className="mb-6">
          <h2 className="text-black font-bold mb-2">Delivery Address</h2>
          <Row label="Address" value={address} />
        </div>

        <Link to="/dashboard/orders" className="text-sm text-gray-500 hover:text-black underline underline-offset-2">
          ← Back to Orders
        </Link>

      </div>
    </div>
  );
};

export default AdminOrderDetailPage;

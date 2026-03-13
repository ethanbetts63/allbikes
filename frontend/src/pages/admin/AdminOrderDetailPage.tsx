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
  const displayPrice = order.product_discount_price && parseFloat(order.product_discount_price) > 0
    ? order.product_discount_price
    : order.product_price;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to="/dashboard/orders" className="text-sm text-gray-500 hover:text-stone-900 underline underline-offset-2 mb-1 block">
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-mono">{order.order_reference}</h1>
        </div>
        {badge && (
          <Badge variant="outline" className={`text-sm px-3 py-1 ${badge.className}`}>{badge.label}</Badge>
        )}
      </div>

      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: order details */}
        <div className="lg:col-span-2 space-y-4">

          <div className="bg-white text-black p-4 rounded-lg border border-gray-300">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Product</h2>
            <p className="font-bold text-stone-900">{order.product_name}</p>
            <p className="text-stone-600 text-sm">${parseFloat(displayPrice).toLocaleString()} incl. GST</p>
          </div>

          <div className="bg-white text-black p-4 rounded-lg border border-gray-300">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Customer</h2>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-stone-900">{order.customer_name}</p>
              <p className="text-stone-600">{order.customer_email}</p>
              {order.customer_phone && <p className="text-stone-600">{order.customer_phone}</p>}
            </div>
          </div>

          <div className="bg-white text-black p-4 rounded-lg border border-gray-300">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Delivery Address</h2>
            <div className="space-y-0.5 text-sm text-stone-700">
              <p>{order.address_line1}</p>
              {order.address_line2 && <p>{order.address_line2}</p>}
              <p>{order.suburb} {order.state} {order.postcode}</p>
            </div>
          </div>

        </div>

        {/* Right: meta + status update */}
        <div className="space-y-4">

          <div className="bg-white text-black p-4 rounded-lg border border-gray-300">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Placed</span>
                <span className="text-stone-900 font-medium">
                  {new Date(order.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-stone-900 font-medium">
                  {new Date(order.updated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white text-black p-4 rounded-lg border border-gray-300">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Update Status</h2>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mb-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button
              onClick={handleStatusUpdate}
              disabled={isSaving || selectedStatus === order.status}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save Status'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;

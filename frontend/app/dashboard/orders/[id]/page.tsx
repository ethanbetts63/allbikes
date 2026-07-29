'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { adminGetOrder, adminUpdateOrderStatus } from '@/api';
import type { Order } from '@/types/Order';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import OrderCustomer from '../_components/OrderCustomer';
import OrderDeliveryAddress from '../_components/OrderDeliveryAddress';
import OrderDetails from '../_components/OrderDetails';
import OrderHeader from '../_components/OrderHeader';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    adminGetOrder(Number(id))
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        setSelectedStatus(data.status);
      })
      .catch(() => {
        if (!cancelled) setNotification({ message: 'Failed to load order.', type: 'error' });
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
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
    return <p className="text-destructive">Order not found.</p>;
  }

  return (
    <div className="p-4 md:p-6">
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] p-4 rounded-lg">
        <OrderHeader
          order={order}
          selectedStatus={selectedStatus}
          isSaving={isSaving}
          onStatusChange={setSelectedStatus}
          onUpdate={handleStatusUpdate}
        />

        <OrderDetails order={order} />
        <OrderCustomer order={order} />
        <OrderDeliveryAddress order={order} />

        <Link
          href="/dashboard/orders"
          className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
        >
          ← Back to Orders
        </Link>
      </div>
    </div>
  );
}

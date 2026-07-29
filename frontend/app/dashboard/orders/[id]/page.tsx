'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  adminGetBikeOrder,
  adminGetProductOrder,
  adminUpdateBikeOrderStatus,
  adminUpdateProductOrderStatus,
} from '@/lib/api';
import type { Order } from '@/types/Order';
import { Spinner } from '@/components/ui/spinner';
import OrderCustomer from '../_components/OrderCustomer';
import OrderDeliveryAddress from '../_components/OrderDeliveryAddress';
import OrderDetails from '../_components/OrderDetails';
import OrderHeader from '../_components/OrderHeader';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const kind = useSearchParams().get('kind');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const request = kind === 'bike' ? adminGetBikeOrder(Number(id)) : adminGetProductOrder(Number(id));
    request
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        setSelectedStatus(data.status);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load order.');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id, kind]);

  const handleStatusUpdate = async () => {
    if (!order || selectedStatus === order.status) return;
    setIsSaving(true);
    try {
      const updated = order.order_kind === 'bike'
        ? await adminUpdateBikeOrderStatus(order.id, selectedStatus)
        : await adminUpdateProductOrderStatus(order.id, selectedStatus);
      setOrder(updated);
      toast.success('Status updated.');
    } catch {
      toast.error('Failed to update status.');
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
          href={order.order_kind === 'bike' ? '/dashboard/bike-orders' : '/dashboard/product-orders'}
          className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
        >
          ← Back to Orders
        </Link>
      </div>
    </div>
  );
}

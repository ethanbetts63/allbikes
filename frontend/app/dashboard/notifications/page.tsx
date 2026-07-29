'use client';

import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { adminGetNotifications } from '@/api';
import type { AdminNotifications } from '@/types/AdminNotifications';
import { Spinner } from '@/components/ui/spinner';
import HireBookings from './_components/HireBookings';
import OrdersToAction from './_components/OrdersToAction';
import PartsOrdersToAction from './_components/PartsOrdersToAction';
import ProductStock from './_components/ProductStock';
import ReservedMotorcycles from './_components/ReservedMotorcycles';

/** Total outstanding items, which also decides whether to show "All clear". */
const outstandingCount = (n: AdminNotifications) =>
  n.parts_orders_to_action.length +
  n.paid_orders.length +
  n.reserved_bikes.length +
  n.active_hire_bookings.length +
  n.attention_products.length;

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotifications | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    adminGetNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  const allClear = notifications !== null && outstandingCount(notifications) === 0;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-1 text-[var(--text-dark-primary)]">Notifications</h1>
      <p className="text-[var(--text-dark-secondary)] text-sm mb-8">
        Welcome back, {user?.first_name || user?.email}.
      </p>

      {isLoading && (
        <div className="flex justify-center pt-12">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {!isLoading && allClear && (
        <div className="flex flex-col items-center pt-12 text-center gap-3">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-[var(--text-dark-primary)] font-semibold">All clear</p>
          <p className="text-[var(--text-dark-secondary)] text-sm">No outstanding items.</p>
        </div>
      )}

      {/* Parts orders lead: they are the group with the tightest clock. Each
          section renders nothing when its list is empty. */}
      {!isLoading && notifications && !allClear && (
        <div className="space-y-8">
          <PartsOrdersToAction orders={notifications.parts_orders_to_action} />
          <OrdersToAction orders={notifications.paid_orders} />
          <ReservedMotorcycles bikes={notifications.reserved_bikes} />
          <HireBookings bookings={notifications.active_hire_bookings} />
          <ProductStock products={notifications.attention_products} />
        </div>
      )}
    </div>
  );
}

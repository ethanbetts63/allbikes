'use client';

import OrderTable from '@/components/OrderTable';

export default function AdminOrderDashboardPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Orders</h1>
      <OrderTable />
    </div>
  );
}

import { useRouter } from 'next/navigation';

import type { NotificationOrder } from '@/types/AdminNotifications';
import NotificationSection, { HEAD_ROW, ROW, TABLE_PANEL, TD_MUTED, TH } from './NotificationSection';

/** Shop orders that are paid but not yet dispatched. */
export default function OrdersToAction({ orders }: { orders: NotificationOrder[] }) {
  const router = useRouter();
  return (
    <NotificationSection title="Orders to action" count={orders.length}>
      <div className={TABLE_PANEL}>
        <table className="w-full text-sm">
          <thead>
            <tr className={HEAD_ROW}>
              <th className={TH}>Reference</th>
              <th className={TH}>Customer</th>
              <th className={TH}>Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map(order => (
              <tr key={`${order.order_kind}-${order.id}`} onClick={() => router.push(`/dashboard/orders/${order.id}?kind=${order.order_kind}`)} className={ROW}>
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-[var(--text-dark-primary)]">
                    {order.order_reference}
                  </span>
                  {order.order_kind === 'bike' && (
                    <span className="ml-2 text-xs bg-stone-200 text-[var(--text-dark-secondary)] px-1.5 py-0.5 rounded font-medium">
                      Deposit
                    </span>
                  )}
                </td>
                <td className={TD_MUTED}>{order.customer_name}</td>
                <td className={TD_MUTED}>
                  {new Date(order.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NotificationSection>
  );
}

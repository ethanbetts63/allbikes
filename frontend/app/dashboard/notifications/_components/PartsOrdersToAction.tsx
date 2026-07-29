import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import type { NotificationPartsOrder } from '@/types/AdminNotifications';
import { PARTS_STATUS_BADGE } from '../../parts-orders/_lib/partsOrderStyles';
import NotificationSection, { HEAD_ROW, ROW, TABLE_PANEL, TD_MUTED, TH } from './NotificationSection';

/** Parts orders that have not reached completed / cancelled / refunded. */
export default function PartsOrdersToAction({ orders }: { orders: NotificationPartsOrder[] }) {
  const router = useRouter();
  return (
    <NotificationSection title="Parts orders to action" count={orders.length}>
      <div className={TABLE_PANEL}>
        <table className="w-full text-sm">
          <thead>
            <tr className={HEAD_ROW}>
              <th className={TH}>Reference</th>
              <th className={TH}>Customer</th>
              <th className={TH}>Items</th>
              <th className={TH}>Status</th>
              <th className={TH}>Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map(order => (
              <tr
                key={order.id}
                onClick={() => router.push(`/dashboard/parts-orders/${order.order_reference}`)}
                className={ROW}
              >
                <td className="px-4 py-3 font-mono font-semibold text-[var(--text-dark-primary)]">
                  {order.order_reference}
                </td>
                <td className={TD_MUTED}>{order.customer_name}</td>
                <td className={TD_MUTED}>{order.item_count}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className={`text-xs ${PARTS_STATUS_BADGE[order.status] ?? 'border-gray-400'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                    {order.has_backorder && (
                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                        Backorder
                      </Badge>
                    )}
                  </div>
                </td>
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

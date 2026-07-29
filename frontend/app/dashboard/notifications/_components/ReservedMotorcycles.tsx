import Link from 'next/link';

import type { NotificationBike } from '@/types/AdminNotifications';
import NotificationSection from './NotificationSection';
import { LIST_PANEL } from '../_lib/notificationStyles';

/** Bikes held for a customer, which need chasing or releasing. */
export default function ReservedMotorcycles({ bikes }: { bikes: NotificationBike[] }) {
  return (
    <NotificationSection title="Reserved motorcycles" count={bikes.length}>
      <div className={LIST_PANEL}>
        {bikes.map(bike => (
          <Link
            key={bike.id}
            href="/dashboard/inventory"
            className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-light-secondary)] transition-colors"
          >
            <span className="text-sm text-[var(--text-dark-primary)] font-medium">
              {bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`}
            </span>
            <span className="text-xs text-[var(--highlight)] font-bold uppercase tracking-widest">Reserved</span>
          </Link>
        ))}
      </div>
    </NotificationSection>
  );
}

import { useRouter } from 'next/navigation';

import type { NotificationInterestEnquiry } from '@/types/AdminNotifications';
import NotificationSection from './NotificationSection';
import { HEAD_ROW, ROW, TABLE_PANEL, TD_MUTED, TH } from '../_lib/notificationStyles';

/** Buyers who registered interest in a bike and are still waiting on a reply. */
export default function InterestEnquiries({ enquiries }: { enquiries: NotificationInterestEnquiry[] }) {
  const router = useRouter();
  return (
    <NotificationSection title="Interest enquiries awaiting reply" count={enquiries.length}>
      <div className={TABLE_PANEL}>
        <table className="w-full text-sm">
          <thead>
            <tr className={HEAD_ROW}>
              <th className={TH}>Bike</th>
              <th className={TH}>Email</th>
              <th className={TH}>Enquired</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {enquiries.map((enquiry) => (
              <tr
                key={enquiry.id}
                onClick={() => router.push(`/dashboard/bike-interest/${enquiry.id}/reply`)}
                className={ROW}
              >
                <td className="px-4 py-3 font-medium text-[var(--text-dark-primary)]">{enquiry.motorcycle_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-dark-primary)]">{enquiry.email}</td>
                <td className={TD_MUTED}>
                  {new Date(enquiry.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NotificationSection>
  );
}

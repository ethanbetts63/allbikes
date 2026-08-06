import { useRouter } from 'next/navigation';

import type { NotificationFailedEmail } from '@/types/AdminNotifications';
import { messageTypeLabel } from '@/lib/messageLabels';
import NotificationSection from './NotificationSection';
import { HEAD_ROW, ROW, TABLE_PANEL, TD_MUTED, TH } from '../_lib/notificationStyles';

/** Failed and bounced emails that need an admin to review their detail record. */
export default function FailedEmails({ messages }: { messages: NotificationFailedEmail[] }) {
  const router = useRouter();
  return (
    <NotificationSection title="Failed emails" count={messages.length}>
      <div className={TABLE_PANEL}>
        <table className="w-full text-sm">
          <thead><tr className={HEAD_ROW}><th className={TH}>To</th><th className={TH}>Message</th><th className={TH}>Status</th><th className={TH}>When</th></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {messages.map((message) => (
              <tr key={message.id} onClick={() => router.push(`/dashboard/messages/${message.id}`)} className={ROW}>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-dark-primary)]">{message.to}</td>
                <td className={TD_MUTED}><span className="block font-medium text-[var(--text-dark-primary)]">{message.subject || messageTypeLabel(message.message_type)}</span>{message.error_message && <span className="block max-w-xl truncate text-xs text-red-700">{message.error_message}</span>}</td>
                <td className="px-4 py-3 capitalize text-red-700">{message.status}</td>
                <td className={TD_MUTED}>{new Date(message.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NotificationSection>
  );
}

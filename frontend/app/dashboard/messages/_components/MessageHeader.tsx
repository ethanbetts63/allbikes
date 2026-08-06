import type { SentMessage } from '@/types/SentMessage';
import StatusBadge from '@/components/ui/status-badge';
import { MESSAGE_STATUS_BADGE, messageTypeLabel } from '@/lib/messageLabels';

/** What kind of message this was, whether it landed, and its id. */
export default function MessageHeader({ message }: { message: SentMessage }) {
  const badge = MESSAGE_STATUS_BADGE[message.status];
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-dark-primary)] mb-1">
          {messageTypeLabel(message.message_type)}
        </h1>
        {badge && (
          <StatusBadge status={message.status} map={MESSAGE_STATUS_BADGE} label={message.status} className="text-sm px-3 py-1" />
        )}
      </div>
      <span className="text-sm text-[var(--text-dark-secondary)] font-mono">#{message.id}</span>
    </div>
  );
}

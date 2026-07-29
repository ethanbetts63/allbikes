import { Badge } from '@/components/ui/badge';
import type { SentMessage } from '@/types/SentMessage';
import { STATUS_BADGE, messageTypeLabel } from '../_lib/messageLabels';

/** What kind of message this was, whether it landed, and its id. */
export default function MessageHeader({ message }: { message: SentMessage }) {
  const badge = STATUS_BADGE[message.status];
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-dark-primary)] mb-1">
          {messageTypeLabel(message.message_type)}
        </h1>
        {badge && (
          <Badge variant="outline" className={`text-sm px-3 py-1 ${badge}`}>{message.status}</Badge>
        )}
      </div>
      <span className="text-sm text-[var(--text-dark-secondary)] font-mono">#{message.id}</span>
    </div>
  );
}

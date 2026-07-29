import Link from 'next/link';
import { formatDate } from '@/utils/formatting';
import type { AdminPartsOrder } from '@/types/partsAdmin';

/** Every email recorded against this order, sent or failed. */
export default function CommunicationHistory({ messages }: {
  messages: AdminPartsOrder['messages'];
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 font-bold">Communication History</h2>
      {messages.length === 0 ? (
        <p className="text-sm text-[var(--text-dark-secondary)]">No emails recorded for this order yet.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border-light">
          {messages.map((message) => (
            <Link
              key={message.id}
              href={`/dashboard/messages/${message.id}`}
              className="block border-b border-border-light p-3 text-sm last:border-0 hover:bg-gray-50"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <strong>
                  {message.subject || message.message_type.replace(/^parts_/, '').replace(/_/g, ' ')}
                </strong>
                <span className={message.status === 'sent' ? 'text-green-700' : 'text-red-600'}>
                  {message.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-[var(--text-dark-secondary)]">
                To: {message.to} · {formatDate(message.sent_at ?? message.created_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { useRouter } from 'next/navigation';

import { formatDateTime } from '@/lib/formatting';
import type { SentMessage } from '@/types/SentMessage';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import StatusBadge from '@/components/ui/status-badge';
import { STATUS_BADGE, messageTypeLabel } from '../_lib/messageLabels';

/** Outbound email log. Clicking a row opens the full message. */
export default function SentMessagesTable({ messages }: { messages: SentMessage[] }) {
  const router = useRouter();
  return (
    <div className="rounded-md border border-border-light overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border-light">
            <TableHead className="text-[var(--text-dark-primary)]">Type</TableHead>
            <TableHead className="text-[var(--text-dark-primary)]">To</TableHead>
            <TableHead className="text-[var(--text-dark-primary)]">Subject</TableHead>
            <TableHead className="text-[var(--text-dark-primary)]">Status</TableHead>
            <TableHead className="text-[var(--text-dark-primary)]">Sent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.length ? (
            messages.map((msg) => (
              <TableRow
                key={msg.id}
                className="border-border-light cursor-pointer hover:bg-[var(--bg-light-secondary)]"
                onClick={() => router.push(`/dashboard/messages/${msg.id}`)}
              >
                <TableCell className="text-[var(--text-dark-primary)] text-sm">
                  {messageTypeLabel(msg.message_type)}
                </TableCell>
                <TableCell className="text-[var(--text-dark-primary)] text-sm font-mono">{msg.to}</TableCell>
                <TableCell className="text-[var(--text-dark-primary)] text-sm max-w-xs truncate">
                  {msg.subject || '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={msg.status} map={STATUS_BADGE} label={msg.status} />
                </TableCell>
                <TableCell className="text-[var(--text-dark-primary)] text-sm">
                  {formatDateTime(msg.sent_at)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-[var(--text-dark-primary)]">
                No messages yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';

import { formatDateTime } from '@/lib/formatting';
import type { SentMessage } from '@/types/SentMessage';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { messageTypeLabel } from '@/lib/messageLabels';

const DELIVERY_STATUS_STYLE: Record<string, { row: string; swatch: string; label: string }> = {
  sent: { row: 'bg-sky-50 hover:bg-sky-100', swatch: 'bg-sky-300', label: 'Sent' },
  delivered: { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Delivered' },
  failed: { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Failed' },
  bounced: { row: 'bg-orange-50 hover:bg-orange-100', swatch: 'bg-orange-300', label: 'Bounced' },
};
const DELIVERY_STATUS_LEGEND = ['sent', 'delivered', 'failed', 'bounced'];

export function MessageDeliveryLegend() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
      <span className="font-medium text-slate-600">Delivery status:</span>
      {DELIVERY_STATUS_LEGEND.map((status) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-sm ${DELIVERY_STATUS_STYLE[status].swatch}`} />
          {DELIVERY_STATUS_STYLE[status].label}
        </span>
      ))}
    </div>
  );
}

/** A clickable, delivery-coloured table for any scoped set of outbound messages. */
export default function MessageTable({ messages, emptyMessage = 'No messages yet.' }: {
  messages: SentMessage[];
  emptyMessage?: string;
}) {
  const router = useRouter();

  return (
    <>
      <MessageDeliveryLegend />
      <div className="rounded-md border border-border-light overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-slate-50">
            <TableRow className="border-border-light hover:bg-slate-50">
              <TableHead className="text-[var(--text-dark-primary)]">Type</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">To</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Subject</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Status</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length ? messages.map((message) => {
              const style = DELIVERY_STATUS_STYLE[message.status] ?? { row: 'hover:bg-slate-50', label: message.status };
              return (
                <TableRow key={message.id} className={`cursor-pointer border-border-light ${style.row}`} onClick={() => router.push(`/dashboard/messages/${message.id}`)}>
                  <TableCell className="text-[var(--text-dark-primary)] text-sm">{messageTypeLabel(message.message_type)}</TableCell>
                  <TableCell className="text-[var(--text-dark-primary)] text-sm font-mono">{message.to}</TableCell>
                  <TableCell className="text-[var(--text-dark-primary)] text-sm max-w-xs truncate">{message.subject || '—'}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-700">{style.label}</TableCell>
                  <TableCell className="text-[var(--text-dark-primary)] text-sm">{formatDateTime(message.sent_at ?? message.created_at)}</TableCell>
                </TableRow>
              );
            }) : <TableRow><TableCell colSpan={5} className="h-24 text-center text-[var(--text-dark-primary)]">{emptyMessage}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

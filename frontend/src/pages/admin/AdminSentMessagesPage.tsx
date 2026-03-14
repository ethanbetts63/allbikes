import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetSentMessages } from '@/api';
import type { SentMessage } from '@/types/SentMessage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_BADGE: Record<string, string> = {
  sent:      'border-green-600 text-highlight1',
  failed:    'border-red-500 text-destructive',
  delivered: 'border-blue-500 text-blue-600',
  bounced:   'border-orange-500 text-orange-600',
};

const TYPE_LABELS: Record<string, string> = {
  customer_confirmation: 'Customer Confirmation',
  admin_new_order:       'Admin New Order',
  admin_reminder:        'Admin Reminder',
};

const AdminSentMessagesPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const data = await adminGetSentMessages({ page });
        setMessages(data.results);
        setTotalCount(data.count);
        setHasNext(!!data.next);
        setHasPrev(!!data.previous);
      } catch {
        setError('Failed to load messages.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-light-primary)]">Sent Messages</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] p-4 rounded-lg">
        {isLoading ? (
          <p className="text-center text-[var(--text-dark-secondary)] py-8">Loading messages...</p>
        ) : (
          <>
            <div className="rounded-md border border-border-light">
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
                        onClick={() => navigate(`/dashboard/messages/${msg.id}`)}
                      >
                        <TableCell className="text-[var(--text-dark-primary)] text-sm">
                          {TYPE_LABELS[msg.message_type] ?? msg.message_type}
                        </TableCell>
                        <TableCell className="text-[var(--text-dark-primary)] text-sm font-mono">{msg.to}</TableCell>
                        <TableCell className="text-[var(--text-dark-primary)] text-sm max-w-xs truncate">{msg.subject || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_BADGE[msg.status] ?? 'text-[var(--text-dark-secondary)] border-gray-400'}>
                            {msg.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[var(--text-dark-primary)] text-sm">
                          {msg.sent_at
                            ? new Date(msg.sent_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
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

            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-[var(--text-dark-secondary)]">{totalCount} message{totalCount !== 1 ? 's' : ''} total</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!hasPrev}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSentMessagesPage;

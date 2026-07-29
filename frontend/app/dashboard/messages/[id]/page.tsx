'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { adminGetSentMessage } from '@/api';
import { formatDateTime } from '@/utils/formatting';
import type { SentMessage } from '@/types/SentMessage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import DetailRow from '@/components/ui/detail-row';
import MessageBodyViewer from '../_components/MessageBodyViewer';
import MessageHeader from '../_components/MessageHeader';

export default function AdminSentMessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState<SentMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    adminGetSentMessage(Number(id))
      .then((data) => { if (!cancelled) setMessage(data); })
      .catch(() => { if (!cancelled) setError('Failed to load message.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error || !message) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? 'Message not found.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="w-full bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] p-4 rounded-lg">
        <MessageHeader message={message} />

        <div className="mb-6">
          <DetailRow label="To" value={message.to} />
          <DetailRow label="Subject" value={message.subject || '—'} />
          <DetailRow label="Channel" value={message.channel} />
          <DetailRow label="Sent" value={formatDateTime(message.sent_at)} />
          <DetailRow label="Created" value={formatDateTime(message.created_at)} />
        </div>

        {message.status === 'failed' && message.error_message && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-destructive">
            <span className="font-semibold">Error: </span>{message.error_message}
          </div>
        )}

        <MessageBodyViewer message={message} />

        <Link
          href="/dashboard/messages"
          className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
        >
          ← Back to Messages
        </Link>
      </div>
    </div>
  );
}

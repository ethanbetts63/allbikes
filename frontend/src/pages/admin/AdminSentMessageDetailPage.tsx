import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetSentMessage } from '@/api';
import type { SentMessage } from '@/types/SentMessage';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

const STATUS_BADGE: Record<string, string> = {
  sent:      'border-green-600 text-green-700',
  failed:    'border-red-500 text-destructive',
  delivered: 'border-blue-500 text-blue-600',
  bounced:   'border-orange-500 text-orange-600',
};

const TYPE_LABELS: Record<string, string> = {
  customer_confirmation: 'Customer Confirmation',
  admin_new_order:       'Admin New Order',
  admin_reminder:        'Admin Reminder',
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
    <span className="text-[var(--text-dark-primary)] font-semibold text-sm w-36 shrink-0">{label}</span>
    <span className="text-[var(--text-dark-secondary)] text-sm text-right">{value}</span>
  </div>
);

const AdminSentMessageDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState<SentMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'html' | 'text'>('html');

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const data = await adminGetSentMessage(Number(id));
        setMessage(data);
      } catch {
        setError('Failed to load message.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
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

  const badge = STATUS_BADGE[message.status];

  return (
    <div>
      <div className="w-full bg-white text-[var(--text-dark-primary)] p-4 rounded-lg">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-dark-primary)] mb-1">
              {TYPE_LABELS[message.message_type] ?? message.message_type}
            </h1>
            {badge && (
              <Badge variant="outline" className={`text-sm px-3 py-1 ${badge}`}>{message.status}</Badge>
            )}
          </div>
          <span className="text-sm text-gray-400 font-mono">#{message.id}</span>
        </div>

        {/* Meta */}
        <div className="mb-6">
          <Row label="To" value={message.to} />
          <Row label="Subject" value={message.subject || '—'} />
          <Row label="Channel" value={message.channel} />
          <Row label="Sent" value={message.sent_at
            ? new Date(message.sent_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '—'} />
          <Row label="Created" value={new Date(message.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
        </div>

        {/* Error */}
        {message.status === 'failed' && message.error_message && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <span className="font-semibold">Error: </span>{message.error_message}
          </div>
        )}

        {/* Body */}
        {(message.body_html || message.body_text) && (
          <div className="mb-6">
            <div className="flex gap-2 mb-2">
              {message.body_html && (
                <button
                  onClick={() => setTab('html')}
                  className={`text-sm px-3 py-1 rounded border ${tab === 'html' ? 'bg-black text-[var(--text-light-primary)] border-black' : 'border-gray-300 text-[var(--text-dark-secondary)] hover:border-gray-400'}`}
                >
                  HTML Preview
                </button>
              )}
              {message.body_text && (
                <button
                  onClick={() => setTab('text')}
                  className={`text-sm px-3 py-1 rounded border ${tab === 'text' ? 'bg-black text-[var(--text-light-primary)] border-black' : 'border-gray-300 text-[var(--text-dark-secondary)] hover:border-gray-400'}`}
                >
                  Plain Text
                </button>
              )}
            </div>

            {tab === 'html' && message.body_html ? (
              <iframe
                srcDoc={message.body_html}
                className="w-full border border-gray-200 rounded"
                style={{ height: '600px' }}
                sandbox="allow-same-origin"
                title="Email HTML preview"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-[var(--text-dark-secondary)] bg-gray-50 border border-gray-200 rounded p-4 font-mono">
                {message.body_text}
              </pre>
            )}
          </div>
        )}

        <Link to="/dashboard/messages" className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2">
          ← Back to Messages
        </Link>

      </div>
    </div>
  );
};

export default AdminSentMessageDetailPage;

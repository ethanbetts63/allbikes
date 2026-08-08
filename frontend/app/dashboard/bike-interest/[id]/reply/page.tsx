'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import EmailComposer from '@/components/messages/EmailComposer';
import { Spinner } from '@/components/ui/spinner';
import { adminGetBikeInterestReplyDraft, adminSendBikeInterestReply } from '@/lib/api';
import type { BikeInterestReplyDraft } from '@/types/BikeInterest';

export default function BikeInterestReplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<BikeInterestReplyDraft | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    adminGetBikeInterestReplyDraft(Number(id))
      .then((data) => {
        if (cancelled) return;
        setDraft(data);
        setSubject(data.subject);
        setBody(data.body);
      })
      .catch(() => toast.error('Failed to load the reply draft.'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const send = async () => {
    if (!draft) return;
    if (!confirm(`Send this reply to ${draft.to}?`)) return;
    setSending(true);
    try {
      await adminSendBikeInterestReply(Number(id), { subject, body });
      toast.success('Reply sent.');
      router.push('/dashboard/bike-interest');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The reply could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-12 w-12" /></div>;
  if (!draft) return <p className="p-6 text-destructive">Reply draft not found.</p>;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl rounded-lg bg-[var(--bg-light-primary)] p-4 text-[var(--text-dark-primary)] md:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold">Reply about the {draft.enquiry.motorcycle_title}</h1>
            <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">
              Edit the wording before sending — a reply that reads like a person wrote it is the whole point of this form.
            </p>
          </div>
          <Link className="text-sm underline underline-offset-2" href="/dashboard/bike-interest">
            ← Back to enquiries
          </Link>
        </div>

        {draft.enquiry.responded && (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            This enquiry has already been replied to. Sending again will email the customer a second time.
          </p>
        )}

        <EmailComposer
          to={draft.to}
          subject={subject}
          body={body}
          sending={sending}
          toReadOnly
          sendLabel="Send reply"
          onToChange={() => {}}
          onSubjectChange={setSubject}
          onBodyChange={setBody}
          onSend={send}
        />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  adminGetPartsSupplierEmailDraft, adminSendPartsSupplierEmail,
  type SupplierEmailDraft,
} from '@/services/partsAdminService';

export default function SupplierEmailPage() {
  const { reference } = useParams<{ reference: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<SupplierEmailDraft | null>(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!reference) return;
    adminGetPartsSupplierEmailDraft(reference)
      .then((data) => { setDraft(data); setSubject(data.subject); setBody(data.body); })
      .catch(() => setMessage({ text: 'Failed to load the supplier email draft.', error: true }))
      .finally(() => setLoading(false));
  }, [reference]);

  const send = async () => {
    if (!to.trim()) { setMessage({ text: 'Enter the supplier email address before sending.', error: true }); return; }
    if (!confirm(`Send this supplier order email to ${to.trim()}?`)) return;
    setSending(true); setMessage(null);
    try {
      await adminSendPartsSupplierEmail(reference, { to, subject, body });
      router.push(`/dashboard/parts-orders/${reference}`);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Supplier email could not be sent.', error: true });
    } finally { setSending(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-12 w-12" /></div>;
  if (!draft) return <p className="p-6 text-destructive">Supplier email draft not found.</p>;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl rounded-lg bg-[var(--bg-light-primary)] p-4 text-[var(--text-dark-primary)] md:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold">Email supplier</h1>
            <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">Review the order before sending. The recipient is deliberately blank.</p>
          </div>
          <Link className="text-sm underline underline-offset-2" href={`/dashboard/parts-orders/${reference}`}>← Back to order</Link>
        </div>

        {message && <Alert variant={message.error ? 'destructive' : 'default'} className="mb-4"><AlertDescription>{message.text}</AlertDescription></Alert>}
        {draft.has_unpriced_items && <Alert variant="destructive" className="mb-4"><AlertDescription>One or more current supplier prices are unavailable. Check the email carefully before sending.</AlertDescription></Alert>}

        <div className="space-y-4">
          <label className="block text-sm font-medium">To
            <input value={to} onChange={(e) => setTo(e.target.value)} type="email" autoComplete="off" placeholder="Enter supplier email address" className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm" />
          </label>
          <label className="block text-sm font-medium">Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm" />
          </label>
          <label className="block text-sm font-medium">Email body
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={24} className="mt-1 w-full rounded-md border border-input bg-transparent p-3 font-mono text-sm leading-6" />
          </label>
          <Button onClick={send} disabled={sending || !to.trim() || !subject.trim() || !body.trim()}>{sending ? 'Sending…' : 'Send supplier email'}</Button>
        </div>
      </div>
    </div>
  );
}

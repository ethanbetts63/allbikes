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

const money = (value: number | null) => value == null ? 'Price unavailable' : `$${value.toFixed(2)}`;

export default function SupplierEmailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<SupplierEmailDraft | null>(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!id) return;
    adminGetPartsSupplierEmailDraft(Number(id))
      .then((data) => { setDraft(data); setSubject(data.subject); setBody(data.body); })
      .catch(() => setMessage({ text: 'Failed to load the supplier email draft.', error: true }))
      .finally(() => setLoading(false));
  }, [id]);

  const send = async () => {
    if (!to.trim()) { setMessage({ text: 'Enter the supplier email address before sending.', error: true }); return; }
    if (!confirm(`Send this supplier order email to ${to.trim()}?`)) return;
    setSending(true); setMessage(null);
    try {
      await adminSendPartsSupplierEmail(Number(id), { to, subject, body });
      router.push(`/dashboard/parts-orders/${id}`);
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
          <Link className="text-sm underline underline-offset-2" href={`/dashboard/parts-orders/${id}`}>← Back to order</Link>
        </div>

        {message && <Alert variant={message.error ? 'destructive' : 'default'} className="mb-4"><AlertDescription>{message.text}</AlertDescription></Alert>}
        {draft.has_unpriced_items && <Alert variant="destructive" className="mb-4"><AlertDescription>One or more current supplier prices are unavailable. Check the email carefully before sending.</AlertDescription></Alert>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
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

          <aside className="h-fit rounded-md border border-border-light p-4">
            <h2 className="mb-1 font-bold">Supplier pricing</h2>
            <p className="mb-4 text-xs text-[var(--text-dark-secondary)]">Current base prices from the supplier feed, before our markup.</p>
            <div className="space-y-3 text-sm">
              {draft.items.map((item) => <div key={item.part_number} className="border-b border-border-light pb-3 last:border-0">
                <p className="font-mono text-xs font-bold">{item.part_number}</p>
                <p className="text-xs text-[var(--text-dark-secondary)]">{item.description}</p>
                <div className="mt-1 flex justify-between"><span>Qty {item.quantity} × {money(item.unit_price)}</span><strong>{money(item.line_total)}</strong></div>
              </div>)}
            </div>
            <div className="mt-4 flex justify-between border-t border-border-light pt-3 text-sm font-bold"><span>Parts total incl. GST</span><span>${draft.supplier_parts_total.toFixed(2)}</span></div>
          </aside>
        </div>
      </div>
    </div>
  );
}

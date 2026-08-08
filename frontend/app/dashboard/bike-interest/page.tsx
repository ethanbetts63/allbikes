'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Mail, MessageSquare } from 'lucide-react';

import MessageHistorySection from '@/components/messages/MessageHistorySection';
import { adminGetBikeInterest } from '@/lib/api';
import type { BikeInterestEnquiry } from '@/types/BikeInterest';

const RESPONDED_STYLE = { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Responded' };
const AWAITING_STYLE = { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Awaiting reply' };

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

export default function BikeInterestAdminPage() {
  const [enquiries, setEnquiries] = useState<BikeInterestEnquiry[] | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    adminGetBikeInterest()
      .then((data) => setEnquiries(data.enquiries))
      .catch(() => setError('Could not load interest enquiries.'));
  }, []);

  if (!enquiries) {
    return <p className="p-6 text-sm text-[var(--text-dark-secondary)]">{error || 'Loading interest enquiries…'}</p>;
  }

  const awaiting = enquiries.filter((enquiry) => !enquiry.responded).length;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-gray-200 pb-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-dark-primary)]">
            <MessageSquare className="h-6 w-6" /> Bike interest
          </h1>
          <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">
            Buyers who asked to be contacted about a specific bike instead of paying a deposit. Compose a reply to work one off the list.
          </p>
        </header>

        {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2">
          <Metric label="Awaiting reply" value={awaiting} />
          <Metric label="Total enquiries" value={enquiries.length} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
          <h2 className="text-lg font-bold">Enquiries</h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Row colour:</span>
            {[AWAITING_STYLE, RESPONDED_STYLE].map((style) => (
              <span key={style.label} className="inline-flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded-sm ${style.swatch}`} />{style.label}
              </span>
            ))}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-2">Bike</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Enquired</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length ? enquiries.map((enquiry) => {
                  const style = enquiry.responded ? RESPONDED_STYLE : AWAITING_STYLE;
                  return (
                    <tr key={enquiry.id} className={`border-b border-gray-100 ${style.row}`}>
                      <td className="py-2 font-medium text-black">
                        <span className="sr-only">{style.label}. </span>{enquiry.motorcycle_title}
                      </td>
                      <td className="py-2">{enquiry.email}</td>
                      <td className="py-2">{formatDate(enquiry.created_at)}</td>
                      <td className="py-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title={`View ${enquiry.motorcycle_title}`}
                            aria-label={`View ${enquiry.motorcycle_title}`}
                            onClick={() => window.open(`/inventory/motorcycles/${enquiry.motorcycle_slug}`, '_blank', 'noopener,noreferrer')}
                            className="rounded p-2 hover:bg-white/60"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/bike-interest/${enquiry.id}/reply`)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {enquiry.responded ? 'Compose again' : 'Compose'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-500">No one has registered interest in a bike yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <MessageHistorySection
          messageType="bike_interest_reply"
          title="Sent reply history"
          description="Each row is an individual reply to an interest enquiry. Select it to view the recorded message."
          emptyMessage="No interest replies have been sent yet."
          noun="interest reply"
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-black">{value}</p>
    </div>
  );
}

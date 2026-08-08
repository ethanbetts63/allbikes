'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft, ChevronRight, ExternalLink, Pencil, Send, Trash2 } from 'lucide-react';

import { adminGetStockAlerts, adminSendStockAlert, setMotorcycleStockAlertInclusion } from '@/lib/api';
import type { StockAlertAdminData } from '@/types/StockAlert';
import MessageHistorySection from '@/components/messages/MessageHistorySection';

const LISTING_STATUS_STYLE: Record<string, { row: string; swatch: string; label: string }> = {
  for_sale: { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'For sale' },
  available_soon: { row: 'bg-sky-50 hover:bg-sky-100', swatch: 'bg-sky-300', label: 'Available soon' },
  reserved: { row: 'bg-amber-50 hover:bg-amber-100', swatch: 'bg-amber-300', label: 'Reserved' },
  sold: { row: 'bg-slate-100 hover:bg-slate-200', swatch: 'bg-slate-400', label: 'Sold' },
  unavailable: { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Unavailable' },
  hide: { row: 'bg-slate-200 hover:bg-slate-300', swatch: 'bg-slate-500', label: 'Hidden' },
};
const LISTING_STATUS_LEGEND = ['for_sale', 'available_soon', 'reserved', 'sold', 'unavailable', 'hide'];
const LISTINGS_PAGE_SIZE = 20;

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

export default function StockAlertsAdminPage() {
  const [data, setData] = useState<StockAlertAdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [listingPage, setListingPage] = useState(1);
  const [error, setError] = useState('');
  const router = useRouter();

  const load = () => adminGetStockAlerts()
    .then(setData)
    .catch(() => setError('Could not load the mailing list.'))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!data) return;
    const { preview } = data;
    if (!preview.items.length || !preview.recipient_count) return;
    if (!window.confirm(`Send “${preview.subject}” to ${preview.recipient_count} subscriber${preview.recipient_count === 1 ? '' : 's'} with ${preview.items.length} bike${preview.items.length === 1 ? '' : 's'}? This cannot be undone.`)) return;

    setSending(true);
    setError('');
    try {
      await adminSendStockAlert();
      setLoading(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The stock update could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const removeFromMailingList = async (id: number, title: string) => {
    if (!window.confirm(`Remove ${title} from the next mailing list? The bike will remain in inventory.`)) return;
    setRemovingId(id);
    setError('');
    try {
      await setMotorcycleStockAlertInclusion(id, false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this listing from the mailing list.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading && !data) return <p className="p-6 text-sm text-[var(--text-dark-secondary)]">Loading mailing list…</p>;
  if (!data) return <p className="p-6 text-destructive">{error || 'Mailing list not found.'}</p>;

  const activeSubscribers = data.subscribers.filter((subscriber) => subscriber.status === 'active').length;
  const canSend = data.preview.items.length > 0 && data.preview.recipient_count > 0 && !sending;
  const listingPageCount = Math.max(1, Math.ceil(data.included_bikes.length / LISTINGS_PAGE_SIZE));
  const currentListingPage = Math.min(listingPage, listingPageCount);
  const visibleListings = data.included_bikes.slice((currentListingPage - 1) * LISTINGS_PAGE_SIZE, currentListingPage * LISTINGS_PAGE_SIZE);
  const listingStart = data.included_bikes.length ? (currentListingPage - 1) * LISTINGS_PAGE_SIZE + 1 : 0;
  const listingEnd = Math.min(currentListingPage * LISTINGS_PAGE_SIZE, data.included_bikes.length);

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-dark-primary)]"><Bell className="h-6 w-6" /> Bike stock alerts</h1>
            <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">The mailing-list queue is controlled entirely by each listing’s “Include in mailing list” field.</p>
          </div>
          <button type="button" onClick={send} disabled={!canSend} className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
            <Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send stock update'}
          </button>
        </header>

        {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2">
          <Metric label="Active subscribers" value={activeSubscribers} />
          <Metric label="Listings to send" value={data.included_bikes.length} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
          <h2 className="text-lg font-bold">Next email preview</h2>
          {data.preview.items.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--text-dark-secondary)]">There are no listings selected for the next stock update.</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">Subject: <span className="font-medium text-black">{data.preview.subject}</span> · {data.preview.recipient_count} active recipient{data.preview.recipient_count === 1 ? '' : 's'}</p>
              <iframe title="Next stock alert email preview" sandbox="allow-same-origin" srcDoc={data.preview.html} className="mt-4 h-[650px] w-full rounded border border-gray-200" />
            </>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
          <h2 className="text-lg font-bold">Listings in next mailing list</h2>
          <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">Every bike below has “Include in mailing list” set to true. Sending the update turns that field off for these bikes.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Row colour:</span>
            {LISTING_STATUS_LEGEND.map((statusKey) => (
              <span key={statusKey} className="inline-flex items-center gap-1.5"><span className={`inline-block h-3 w-3 rounded-sm ${LISTING_STATUS_STYLE[statusKey].swatch}`} />{LISTING_STATUS_STYLE[statusKey].label}</span>
            ))}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500"><tr><th className="pb-2">Listing</th><th className="pb-2">Condition</th><th className="pb-2">Type</th><th className="pb-2 text-right">Price</th><th className="pb-2 text-right">Actions</th></tr></thead>
              <tbody>
                {data.included_bikes.length ? visibleListings.map((bike) => (
                  <tr key={bike.id} className={`border-b border-gray-100 ${LISTING_STATUS_STYLE[bike.status]?.row ?? 'hover:bg-slate-50'}`}>
                    <td className="py-2 font-medium text-black"><span className="sr-only">Status: {LISTING_STATUS_STYLE[bike.status]?.label ?? bike.status}. </span>{bike.title}</td>
                    <td className="py-2 capitalize">{bike.condition}</td>
                    <td className="py-2 capitalize">{bike.vehicle_type}</td>
                    <td className="py-2 text-right font-semibold text-black">{bike.price_label}</td>
                    <td className="py-2"><div className="flex justify-end gap-1">
                      <button type="button" title={`View ${bike.title}`} aria-label={`View ${bike.title}`} onClick={() => window.open(bike.listing_url, '_blank', 'noopener,noreferrer')} className="rounded p-2 hover:bg-gray-100"><ExternalLink className="h-4 w-4" /></button>
                      <button type="button" title={`Edit ${bike.title}`} aria-label={`Edit ${bike.title}`} onClick={() => router.push(`/dashboard/edit-motorcycle/${bike.id}`)} className="rounded p-2 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
                      <button type="button" title={`Remove ${bike.title} from mailing list`} aria-label={`Remove ${bike.title} from mailing list`} disabled={removingId === bike.id} onClick={() => removeFromMailingList(bike.id, bike.title)} className="rounded p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                    </div></td>
                  </tr>
                )) : <tr><td colSpan={5} className="py-6 text-center text-gray-500">No listings are selected for the next mailing list.</td></tr>}
              </tbody>
            </table>
          </div>
          <footer className="mt-3 flex flex-col gap-3 border-t border-gray-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Showing {listingStart}-{listingEnd} of {data.included_bikes.length.toLocaleString('en-AU')}</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={currentListingPage <= 1} onClick={() => setListingPage(currentListingPage - 1)} className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"><ChevronLeft className="mr-1 h-4 w-4" />Previous</button>
              <span className="min-w-20 text-center text-sm text-slate-600">Page {currentListingPage} of {listingPageCount}</span>
              <button type="button" disabled={currentListingPage >= listingPageCount} onClick={() => setListingPage(currentListingPage + 1)} className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400">Next<ChevronRight className="ml-1 h-4 w-4" /></button>
            </div>
          </footer>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
          <h2 className="text-lg font-bold">Subscribers</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500"><tr><th className="pb-2">Email</th><th className="pb-2">Status</th><th className="pb-2">Signed up</th><th className="pb-2">Unsubscribed</th></tr></thead>
              <tbody>{data.subscribers.length ? data.subscribers.map((subscriber) => <tr key={subscriber.id} className="border-b border-gray-100"><td className="py-2 font-medium text-black">{subscriber.email}</td><td className="py-2 capitalize">{subscriber.status}</td><td className="py-2">{formatDate(subscriber.subscribed_at)}</td><td className="py-2">{formatDate(subscriber.unsubscribed_at)}</td></tr>) : <tr><td colSpan={4} className="py-6 text-center text-gray-500">No subscribers yet.</td></tr>}</tbody>
            </table>
          </div>
        </section>

        <MessageHistorySection
          messageType="stock_alert_update"
          title="Sent update history"
          description="Each row is an individual stock-alert email. Select it to view the recorded message."
          emptyMessage="No stock alert emails have been sent yet."
          noun="stock alert message"
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-gray-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-black">{value}</p></div>;
}

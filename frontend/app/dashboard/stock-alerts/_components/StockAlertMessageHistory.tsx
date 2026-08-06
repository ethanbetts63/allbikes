'use client';

import { useEffect, useState } from 'react';

import MessageTable from '@/components/messages/MessageTable';
import PaginationBar from '@/components/ui/pagination-bar';
import { adminGetSentMessages } from '@/lib/api';
import type { SentMessage } from '@/types/SentMessage';

/** Delivery-level history for stock alert emails, rather than campaign summaries. */
export default function StockAlertMessageHistory() {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminGetSentMessages({ message_type: 'stock_alert_update', page })
      .then((data) => {
        if (cancelled) return;
        setMessages(data.results);
        setTotal(data.count);
        setHasNext(Boolean(data.next));
        setHasPrevious(Boolean(data.previous));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  const changePage = (nextPage: number) => {
    setLoading(true);
    setPage(nextPage);
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
      <h2 className="text-lg font-bold">Sent update history</h2>
      <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">Each row is an individual stock-alert email. Select it to view the recorded message.</p>
      <div className="mt-3">
        {loading ? <p className="py-6 text-center text-sm text-[var(--text-dark-secondary)]">Loading stock alert messages...</p> : <><MessageTable messages={messages} emptyMessage="No stock alert emails have been sent yet." /><PaginationBar summary={`${total} stock alert message${total === 1 ? '' : 's'} total`} hasPrevious={hasPrevious} hasNext={hasNext} onPrevious={() => changePage(page - 1)} onNext={() => changePage(page + 1)} /></>}
      </div>
    </section>
  );
}

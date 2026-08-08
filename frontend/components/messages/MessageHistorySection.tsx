'use client';

import { useEffect, useState } from 'react';

import MessageTable from '@/components/messages/MessageTable';
import PaginationBar from '@/components/ui/pagination-bar';
import { adminGetSentMessages } from '@/lib/api';
import type { SentMessage } from '@/types/SentMessage';

/**
 * Delivery-level history for one kind of outbound email.
 *
 * Each row is an individual send rather than a campaign summary, so the same
 * section works whether the message type goes out in bulk (stock alerts) or one
 * at a time (interest replies).
 */
export default function MessageHistorySection({
  messageType, title, description, emptyMessage, noun,
}: {
  messageType: string;
  title: string;
  description: string;
  emptyMessage: string;
  /** Singular noun for the pagination summary, e.g. "stock alert message". */
  noun: string;
}) {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminGetSentMessages({ message_type: messageType, page })
      .then((data) => {
        if (cancelled) return;
        setMessages(data.results);
        setTotal(data.count);
        setHasNext(Boolean(data.next));
        setHasPrevious(Boolean(data.previous));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [messageType, page]);

  const changePage = (nextPage: number) => {
    setLoading(true);
    setPage(nextPage);
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">{description}</p>
      <div className="mt-3">
        {loading ? (
          <p className="py-6 text-center text-sm text-[var(--text-dark-secondary)]">Loading messages...</p>
        ) : (
          <>
            <MessageTable messages={messages} emptyMessage={emptyMessage} />
            <PaginationBar
              summary={`${total} ${noun}${total === 1 ? '' : 's'} total`}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              onPrevious={() => changePage(page - 1)}
              onNext={() => changePage(page + 1)}
            />
          </>
        )}
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';

import { adminGetSentMessages } from '@/api';
import type { SentMessage } from '@/types/SentMessage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PaginationBar from '@/components/ui/pagination-bar';
import SentMessagesTable from './_components/SentMessagesTable';

export default function AdminSentMessagesPage() {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminGetSentMessages({ page })
      .then((data) => {
        if (cancelled) return;
        setMessages(data.results);
        setTotalCount(data.count);
        setHasNext(!!data.next);
        setHasPrev(!!data.previous);
      })
      .catch(() => { if (!cancelled) setError('Failed to load messages.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  // Loading is flipped by the page change rather than by the effect itself,
  // which keeps every setState out of the effect body.
  const goToPage = (nextPage: number) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Sent Messages</h1>

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
            <SentMessagesTable messages={messages} />
            <PaginationBar
              summary={`${totalCount} message${totalCount !== 1 ? 's' : ''} total`}
              hasPrevious={hasPrev}
              hasNext={hasNext}
              onPrevious={() => goToPage(page - 1)}
              onNext={() => goToPage(page + 1)}
            />
          </>
        )}
      </div>
    </div>
  );
}

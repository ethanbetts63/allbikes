'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import ModelCard from '@/app/parts/_components/ModelCard';
import type { PartsSearchResults } from '@/types/parts';
import PartResultRow from './PartResultRow';

const MIN_QUERY_LENGTH = 2;

const EMPTY = (query: string): PartsSearchResults => ({ query, parts: [], models: [] });

export default function PartsSearchScreen() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();

  const [results, setResults] = useState<PartsSearchResults>(EMPTY(query));

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    fetch(`/api/parts/search/?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('search failed'))))
      .then((data: PartsSearchResults) => setResults(data))
      .catch((err) => {
        if (err.name === 'AbortError') return; // superseded by a newer query
        setResults(EMPTY(query));
      });
    return () => controller.abort();
  }, [query]);

  const { parts, models } = results;
  // Results carry the query they answered, so a stale set reads as loading.
  const loading = query.length >= MIN_QUERY_LENGTH && results.query !== query;
  const hasResults = parts.length > 0 || models.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-black">
        Search results for <span className="text-gray-600">“{query}”</span>
      </h1>

      {query.length < MIN_QUERY_LENGTH ? (
        <p className="text-gray-600">Type at least {MIN_QUERY_LENGTH} characters to search.</p>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <p className="text-sm text-gray-500">Searching…</p>
        </div>
      ) : (
        <>
          {!hasResults && (
            <p className="text-gray-600">
              No matches. Try a full part number (e.g.{' '}
              <span className="font-mono">53205-ALA-000</span>) or a model name.
            </p>
          )}

          {models.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Models</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {models.map((m) => <ModelCard key={m.slug} model={m} />)}
              </div>
            </section>
          )}

          {parts.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">Parts</h2>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {parts.map((part) => <PartResultRow key={part.part_number} part={part} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

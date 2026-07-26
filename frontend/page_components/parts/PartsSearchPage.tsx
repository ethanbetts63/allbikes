'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import ModelCard from '@/components/parts/ModelCard';
import type { PartsSearchResults, SearchPartResult } from '@/types/parts';

const EMPTY = (query: string): PartsSearchResults => ({ query, parts: [], models: [] });

export default function PartsSearchPage() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();

  const [results, setResults] = useState<PartsSearchResults>(EMPTY(query));
  const [loading, setLoading] = useState(query.length >= 2);

  useEffect(() => {
    if (query.length < 2) {
      setResults(EMPTY(query));
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/parts/search/?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('search failed'))))
      .then((data: PartsSearchResults) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return; // superseded by a newer query
        setResults(EMPTY(query));
        setLoading(false);
      });
    return () => controller.abort();
  }, [query]);

  const { parts, models } = results;
  const hasResults = parts.length > 0 || models.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-black">
        Search results for <span className="text-gray-600">“{query}”</span>
      </h1>

      {query.length < 2 ? (
        <p className="text-gray-600">Type at least 2 characters to search.</p>
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
                {models.map((m) => (
                  <ModelCard key={m.slug} model={m} />
                ))}
              </div>
            </section>
          )}

          {parts.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">Parts</h2>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {parts.map((part) => (
                  <PartResultRow key={part.part_number} part={part} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PartResultRow({ part }: { part: SearchPartResult }) {
  const target = part.sections[0];
  const inner = (
    <div className="flex flex-wrap items-center justify-between gap-2 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-black">{part.part_number}</span>
          {part.colour_name && (
            <span className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-700">
              {part.colour_name}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600">{part.description}</div>
        {target && (
          <div className="text-xs text-gray-500">
            {target.model_name} · {target.section_name} · #{target.ref_number}
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-black">
          {part.price ? `$${part.price}` : part.orderable ? '—' : 'Not available'}
        </div>
        {target && <div className="text-xs text-gray-500">View diagram →</div>}
      </div>
    </div>
  );

  if (target) {
    return (
      <li>
        <Link href={`/parts/${target.model_slug}/${target.section_id}`} className="block hover:bg-gray-50">
          {inner}
        </Link>
      </li>
    );
  }
  return <li>{inner}</li>;
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import ModelCard from '@/app/parts/_components/ModelCard';
import type { PartsSearchResults, VinLookupResult } from '@/types/parts';
import PartResultRow from './PartResultRow';

const MIN_QUERY_LENGTH = 2;

const EMPTY = (query: string): PartsSearchResults => ({ query, parts: [], models: [] });

function LoadingResults({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-black" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function VinResults({ result }: { result: VinLookupResult }) {
  if (result.problem) {
    return (
      <p className="text-gray-600">
        {result.problem} Check the VIN and try again, or search by part number or model name.
      </p>
    );
  }

  const single = result.models.length === 1;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
        {single ? 'Most likely model' : 'Possible models'}
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        {single
          ? 'Check the model code on your bike before ordering.'
          : 'The VIN cannot distinguish the listed revisions. Check the model code on your bike before ordering.'}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {result.models.map((model) => <ModelCard key={model.slug} model={model} />)}
      </div>
    </section>
  );
}

export default function PartsSearchScreen() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const vin = (searchParams.get('vin') ?? '').trim();

  const [results, setResults] = useState<PartsSearchResults>(EMPTY(query));
  const [vinResult, setVinResult] = useState<VinLookupResult | null>(null);

  useEffect(() => {
    if (vin || query.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    fetch(`/api/parts/search/?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('search failed'))))
      .then((data: PartsSearchResults) => setResults(data))
      .catch((error) => {
        if (error.name !== 'AbortError') setResults(EMPTY(query));
      });
    return () => controller.abort();
  }, [query, vin]);

  useEffect(() => {
    if (!vin) return;
    const controller = new AbortController();
    fetch(`/api/parts/vin-lookup/?vin=${encodeURIComponent(vin)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('VIN lookup failed'))))
      .then((data: VinLookupResult) => setVinResult(data))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setVinResult({ vin, year: null, model_family: '', models: [], problem: 'Something went wrong looking that up.', note: '' });
        }
      });
    return () => controller.abort();
  }, [vin]);

  const isVinLookup = Boolean(vin);
  const loadingSearch = query.length >= MIN_QUERY_LENGTH && results.query !== query;
  const hasResults = results.parts.length > 0 || results.models.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-black">
        {isVinLookup ? (
          <>VIN results for <span className="text-gray-600">&ldquo;{vin}&rdquo;</span></>
        ) : (
          <>Search results for <span className="text-gray-600">&ldquo;{query}&rdquo;</span></>
        )}
      </h1>

      {isVinLookup ? (
        vinResult?.vin !== vin ? <LoadingResults label="Finding your model..." /> : <VinResults result={vinResult} />
      ) : query.length < MIN_QUERY_LENGTH ? (
        <p className="text-gray-600">Type at least {MIN_QUERY_LENGTH} characters to search.</p>
      ) : loadingSearch ? (
        <LoadingResults label="Searching..." />
      ) : (
        <>
          {!hasResults && (
            <p className="text-gray-600">
              No matches. Try a full part number (e.g. <span className="font-mono">53205-ALA-000</span>) or a model name.
            </p>
          )}

          {results.models.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Models</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {results.models.map((model) => <ModelCard key={model.slug} model={model} />)}
              </div>
            </section>
          )}

          {results.parts.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">Parts</h2>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {results.parts.map((part) => <PartResultRow key={part.part_number} part={part} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

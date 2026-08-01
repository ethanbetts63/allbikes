'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';

import type { VinLookupResult } from '@/types/parts';

/** The decoder only reads the first eleven characters, but the full VIN is
 *  required anyway: a customer who has transcribed all seventeen has plainly
 *  read them off the bike, which is the weakest link in the whole lookup. */
const VIN_LENGTH = 17;

function clean(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function VinLookup() {
  const [vin, setVin] = useState('');
  const [result, setResult] = useState<VinLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const normalised = clean(vin);
  const incomplete = normalised.length > 0 && normalised.length < VIN_LENGTH;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (normalised.length !== VIN_LENGTH) return;
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/parts/vin-lookup/?vin=${encodeURIComponent(normalised)}`);
      if (!response.ok) throw new Error('lookup failed');
      setResult((await response.json()) as VinLookupResult);
    } catch {
      setResult(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-black">Not sure which model you have?</h2>
      <p className="mt-1 text-sm text-gray-600">
        Enter the VIN stamped on your frame and we&apos;ll find the most likely parts book. It&apos;s usually on
        the frame rail under the seat or near the centre stand.
      </p>

      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="vin" className="sr-only">
          Vehicle Identification Number
        </label>
        <input
          id="vin"
          name="vin"
          value={vin}
          onChange={(event) => setVin(event.target.value)}
          placeholder="e.g. RFGLH18W8DS100773"
          autoComplete="off"
          spellCheck={false}
          // Room for the separators people type; clean() strips them back to 17.
          maxLength={25}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm uppercase tracking-wide text-black placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-black focus:outline-none"
        />
        <button
          type="submit"
          disabled={normalised.length !== VIN_LENGTH || loading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Find my model
        </button>
      </form>

      {incomplete && (
        <p className="mt-2 text-sm text-gray-500">
          Keep going — a VIN is {VIN_LENGTH} characters ({normalised.length} so far).
        </p>
      )}

      {failed && (
        <p className="mt-3 text-sm text-red-700">
          Something went wrong looking that up. Please try again, or pick your model below.
        </p>
      )}

      {result && <VinResult result={result} />}
    </section>
  );
}

function VinResult({ result }: { result: VinLookupResult }) {
  const { models, year, problem } = result;

  if (problem) {
    return (
      <div className="mt-4 rounded-md border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-700">{problem}</p>
        <p className="mt-2 text-sm text-gray-500">Pick your model from the list below.</p>
      </div>
    );
  }

  const single = models.length === 1;

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-700">
        {single
          ? 'Most likely parts book for that VIN:'
          : `Most likely parts books for that VIN — ${models.length} possibilities:`}
        {year !== null && <span className="text-gray-500"> Built {year}.</span>}
      </p>
      {!single && (
        // Several books can share a VIN family and differ only by a revision
        // the VIN never records, so the customer picks rather than us guessing.
        // Years are deliberately not shown here: they are evidence of presence
        // only and are known to run years short at both ends, so a customer
        // comparing their build year against them would rule books out on an
        // absence that carries no information.
        <p className="mt-1 text-sm text-gray-500">
          The VIN doesn&apos;t record which revision you have. Check the model name on your bike
          against the options below.
        </p>
      )}

      <ul className="mt-3 divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-200 bg-white">
        {models.map((model) => (
          <li key={model.slug}>
            <Link
              href={`/parts/new/sym/${model.slug}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-gray-50"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-black">{model.name}</span>
                <span className="mt-0.5 block font-mono text-xs text-gray-500">
                  {model.model_code}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-black underline">
                Browse parts
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {single && models[0].confirmed_years && (
        <p className="mt-2 text-sm text-gray-500">
          We have documented this book in {models[0].confirmed_years}. That is what we have
          confirmed, not the full production run — it may well cover years we haven&apos;t
          documented, so a different build year doesn&apos;t rule it out.
        </p>
      )}

      <p className="mt-2 text-sm text-gray-500">
        This is a guide, not a confirmed match. Check the model code against your bike before
        ordering — choosing parts that fit your vehicle remains your responsibility.
      </p>
    </div>
  );
}

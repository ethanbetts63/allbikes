import type { Metadata } from 'next';
import { searchParts } from '@/lib/partsApi';
import PartsSearchPage from '@/page_components/parts/PartsSearchPage';
import type { PartsSearchResults } from '@/types/parts';

export const metadata: Metadata = {
  title: 'Search SYM Parts',
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  let results: PartsSearchResults = { query, parts: [], models: [] };
  if (query.length >= 2) {
    try {
      results = await searchParts(query);
    } catch {
      results = { query, parts: [], models: [] };
    }
  }
  return <PartsSearchPage results={results} />;
}

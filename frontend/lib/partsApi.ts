import type {
  CcClass,
  PartsModelDetail,
  PartsModelListItem,
  SectionDetail,
} from '@/types/parts';

const API_BASE_URL = process.env.DJANGO_API_URL ?? 'http://localhost:8000';
const REVALIDATE_SECONDS = 300;

async function fetchServerJson<T>(path: string, revalidate = REVALIDATE_SECONDS): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate },
  });
  if (!response.ok) {
    throw new Error(`Parts API ${path} failed: ${response.status}`);
  }
  return response.json();
}

export async function getPartsModels(ccClass?: CcClass): Promise<PartsModelListItem[]> {
  const query = ccClass ? `?cc_class=${ccClass}` : '';
  return fetchServerJson<PartsModelListItem[]>(`/api/parts/models/${query}`);
}

export async function getPartsModel(slug: string): Promise<PartsModelDetail> {
  return fetchServerJson<PartsModelDetail>(`/api/parts/models/${slug}/`);
}

export async function getPartsSection(modelSlug: string, sectionCode: string): Promise<SectionDetail> {
    // Pricing changes daily; keep section pricing reasonably fresh.
  return fetchServerJson<SectionDetail>(
    `/api/parts/models/${encodeURIComponent(modelSlug)}/sections/${encodeURIComponent(sectionCode)}/`,
    60,
  );
}

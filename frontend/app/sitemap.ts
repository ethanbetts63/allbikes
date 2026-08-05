import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { getServerBikes, getServerProducts } from '@/lib/serverApi';
import { getAllArticleMeta } from '@/lib/articles';
import type { Bike } from '@/types/Bike';
import type { Product } from '@/types/Product';
import type { PaginatedResponse } from '@/types/PaginatedResponse';
import { getPartsModels } from '@/lib/partsApi';
import type { PartsModelListItem } from '@/types/parts';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, lastModified: '2026-05-22' },
  { url: `${SITE_URL}/inventory/scooters/new`, lastModified: '2026-06-26' },
  { url: `${SITE_URL}/inventory/motorcycles/used`, lastModified: '2026-05-23' },
  { url: `${SITE_URL}/inventory/scooters/used`, lastModified: '2026-05-23' },
  { url: `${SITE_URL}/inventory/motorcycles/parts`, lastModified: '2026-05-22' },
  { url: `${SITE_URL}/escooters`, lastModified: '2026-05-23' },
  { url: `${SITE_URL}/hire`, lastModified: '2026-06-26' },
  { url: `${SITE_URL}/service`, lastModified: '2026-07-13' },
  { url: `${SITE_URL}/vespa-service-perth`, lastModified: '2026-07-13' },
  { url: `${SITE_URL}/50cc-scooters-perth`, lastModified: '2026-07-23' },
  { url: `${SITE_URL}/125cc-scooters-perth`, lastModified: '2026-07-27' },
  { url: `${SITE_URL}/vespa-perth`, lastModified: '2026-07-23' },
  { url: `${SITE_URL}/sym`, lastModified: '2026-07-27' },
  { url: `${SITE_URL}/motorcycles-perth`, lastModified: '2026-08-05' },
  { url: `${SITE_URL}/parts/new/sym` },
  { url: `${SITE_URL}/scooter-service`, lastModified: '2026-07-13' },
  { url: `${SITE_URL}/motorcycle-service`, lastModified: '2026-07-13' },
  { url: `${SITE_URL}/tyre-fitting`, lastModified: '2026-07-13' },
  { url: `${SITE_URL}/contact`, lastModified: '2026-05-22' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bikes, products, partsModels] = await Promise.all([
    // Hidden bikes are kept out of listings and carousels but stay indexable at
    // their own URL, so the sitemap has to ask for them explicitly.
    fetchAllPages<Bike>(getServerBikes, { include_hidden: 'true' }),
    fetchAllPages<Product>(getServerProducts),
    getPartsModels(),
  ]);

  const bikeRoutes = bikes
    // Every bike keeps its page except 'unavailable' ones — sold and reserved
    // listings still hold search value, and hidden ones are only hidden from
    // browsing, not from search.
    .filter((bike) => bike.status !== 'unavailable')
    .map((bike): MetadataRoute.Sitemap[number] => ({
      url: `${SITE_URL}/inventory/motorcycles/${bike.slug}`,
      lastModified: bike.date_posted,
    }));

  const productRoutes = products.map((product): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}/escooters/${product.slug}`,
    lastModified: product.updated_at,
  }));

  const articleRoutes = getAllArticleMeta().map((article): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}/blog/${article.slug}`,
    lastModified: article.lastModified,
  }));

  const blogIndex: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/blog`,
    lastModified: '2026-05-23',
  };

  const partsRoutes = getPartsSitemapRoutes(partsModels);

  return [...STATIC_ROUTES, blogIndex, ...articleRoutes, ...bikeRoutes, ...productRoutes, ...partsRoutes];
}

/**
 * Model pages only. The ~1,900 section (diagram) pages are deliberately left
 * out: they stay fully indexable and are linked from every model page, so
 * Google reaches them by crawling — but keeping them out of the sitemap stops
 * them from drowning the landing and model pages, which we want discovered and
 * indexed first.
 */
function getPartsSitemapRoutes(models: PartsModelListItem[]): MetadataRoute.Sitemap {
  return models.map((model) => ({
    url: `${SITE_URL}/parts/new/sym/${model.slug}`,
    lastModified: model.last_ingested_at || undefined,
  }));
}

async function fetchAllPages<T>(
  fetchPage: (params: URLSearchParams) => Promise<PaginatedResponse<T>>,
  extraParams: Record<string, string> = {}
): Promise<T[]> {
  const params = (page: number) =>
    new URLSearchParams({ ...extraParams, page: String(page), page_size: '100' });

  const firstPage = await fetchPage(params(1));
  const pageCount = Math.ceil(firstPage.count / 100);

  if (pageCount <= 1) {
    return firstPage.results;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => fetchPage(params(index + 2)))
  );

  return [
    ...firstPage.results,
    ...remainingPages.flatMap((page) => page.results),
  ];
}

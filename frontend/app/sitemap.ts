import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { getServerBikes, getServerProducts } from '@/lib/serverApi';
import { getAllArticleMeta } from '@/lib/articles';
import type { Bike } from '@/types/Bike';
import type { Product } from '@/types/Product';
import type { PaginatedResponse } from '@/types/PaginatedResponse';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, lastModified: '2026-05-22' },
  { url: `${SITE_URL}/inventory/scooters/new`, lastModified: '2026-05-23' },
  { url: `${SITE_URL}/inventory/motorcycles/used`, lastModified: '2026-05-23' },
  { url: `${SITE_URL}/inventory/scooters/used`, lastModified: '2026-05-23' },
  { url: `${SITE_URL}/inventory/motorcycles/parts`, lastModified: '2026-05-22' },
  { url: `${SITE_URL}/escooters`, lastModified: '2026-05-23' },
  { url: `${SITE_URL}/hire`, lastModified: '2026-05-22' },
  { url: `${SITE_URL}/service`, lastModified: '2026-05-22' },
  { url: `${SITE_URL}/scooter-service`, lastModified: '2026-05-23' },
  { url: `${SITE_URL}/motorcycle-service`, lastModified: '2026-05-23' },
  { url: `${SITE_URL}/service-booking`, lastModified: '2026-05-22' },
  { url: `${SITE_URL}/tyre-fitting`, lastModified: '2026-05-22' },
  { url: `${SITE_URL}/contact`, lastModified: '2026-05-22' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bikes, products] = await Promise.all([
    fetchAllPages<Bike>(getServerBikes),
    fetchAllPages<Product>(getServerProducts),
  ]);

  const bikeRoutes = bikes
    .filter((bike) => bike.status === 'for_sale')
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

  return [...STATIC_ROUTES, blogIndex, ...articleRoutes, ...bikeRoutes, ...productRoutes];
}

async function fetchAllPages<T>(
  fetchPage: (params: URLSearchParams) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
  const firstPage = await fetchPage(new URLSearchParams({ page: '1', page_size: '100' }));
  const pageCount = Math.ceil(firstPage.count / 100);

  if (pageCount <= 1) {
    return firstPage.results;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchPage(new URLSearchParams({ page: String(index + 2), page_size: '100' }))
    )
  );

  return [
    ...firstPage.results,
    ...remainingPages.flatMap((page) => page.results),
  ];
}

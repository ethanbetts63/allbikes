import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { getServerBikes, getServerProducts } from '@/lib/serverApi';
import type { Bike } from '@/types/Bike';
import type { Product } from '@/types/Product';
import type { PaginatedResponse } from '@/types/PaginatedResponse';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
  { url: `${SITE_URL}/inventory/motorcycles/new`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${SITE_URL}/inventory/motorcycles/used`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${SITE_URL}/inventory/motorcycles/parts`, changeFrequency: 'daily', priority: 0.6 },
  { url: `${SITE_URL}/escooters`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${SITE_URL}/electric-scooters`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/hire`, changeFrequency: 'daily', priority: 0.7 },
  { url: `${SITE_URL}/service`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/service-booking`, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${SITE_URL}/tyre-fitting`, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/refunds`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/security`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/terms`, changeFrequency: 'monthly', priority: 0.3 },
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
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

  const productRoutes = products.map((product): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}/escooters/${product.slug}`,
    lastModified: product.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...STATIC_ROUTES, ...bikeRoutes, ...productRoutes];
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

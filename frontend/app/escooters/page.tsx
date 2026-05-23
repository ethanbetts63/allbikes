import { buildMetadata, buildProductListSchema } from '@/lib/seo';
import { getInitialProductList } from '@/lib/productList';
import type { ListSearchParams } from '@/lib/listQuery';
import ElectricScootersLandingPage from '@/page_components/ElectricScootersLandingPage';

export const metadata = buildMetadata({
  title: 'Buy Electric Scooters Online | Free AU Delivery',
  description: 'Shop electric scooters online with free Australia-wide delivery, GST-inclusive pricing, secure Stripe checkout, and 12-month warranty.',
  canonicalPath: '/escooters',
});

export const revalidate = 300;

interface PageProps {
  searchParams?: Promise<ListSearchParams>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { products, totalPages, currentPage, filters } = await getInitialProductList(params);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductListSchema(products, 'Electric Scooters for Sale', '/escooters')) }}
      />
      <ElectricScootersLandingPage
        products={products}
        totalPages={totalPages}
        currentPage={currentPage}
        filters={filters}
      />
    </>
  );
}

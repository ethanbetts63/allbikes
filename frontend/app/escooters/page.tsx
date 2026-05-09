import { buildMetadata } from '@/lib/seo';
import { getInitialProductList } from '@/lib/productList';
import EScooterListPage from '@/page_components/EScooterListPage';
import type { ListSearchParams } from '@/lib/listQuery';

export const metadata = buildMetadata({
  title: 'Electric Scooters for Sale | ScooterShop Perth',
  description: 'Shop electric scooters online. All prices include GST with free delivery Australia-wide and secure payment via Stripe.',
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
    <EScooterListPage
      products={products}
      totalPages={totalPages}
      currentPage={currentPage}
      filters={filters}
    />
  );
}

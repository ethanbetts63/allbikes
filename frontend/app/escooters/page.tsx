import { buildMetadata } from '@/lib/seo';
import { getInitialProductList } from '@/lib/productList';
import EScooterListPage from '@/pages_vite/EScooterListPage';

export const metadata = buildMetadata({
  title: 'Electric Scooters for Sale | ScooterShop Perth',
  description: 'Shop electric scooters online. All prices include GST with free delivery Australia-wide and secure payment via Stripe.',
  canonicalPath: '/escooters',
});

export const revalidate = 300;

export default async function Page() {
  const { products, totalPages } = await getInitialProductList();
  return (
    <EScooterListPage
      initialProducts={products}
      initialTotalPages={totalPages}
    />
  );
}

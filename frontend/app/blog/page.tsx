import { getAllArticleMeta } from '@/lib/articles';
import { buildMetadata } from '@/lib/seo';
import BlogListingPage from '@/page_components/BlogListingPage';

export const metadata = buildMetadata({
  title: 'Scooter & Motorcycle Guides | ScooterShop Perth',
  description: 'Practical guides on buying, riding, and owning scooters and motorcycles in Perth and Western Australia. Licensing, costs, laws, and buying tips.',
  canonicalPath: '/blog',
});

export default function Page() {
  const articles = getAllArticleMeta();
  return <BlogListingPage articles={articles} />;
}

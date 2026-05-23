import Link from 'next/link';
import type { ArticleMeta } from '@/lib/articles';

interface Props {
  articles: ArticleMeta[];
}

export default function BlogListingPage({ articles }: Props) {
  return (
    <main className="container mx-auto px-6 py-16 max-w-4xl">
      <div className="mb-12">
        <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
          Guides &amp; Articles
        </p>
        <h1 className="text-3xl font-bold text-[var(--text-light-primary)] mb-4">
          Scooter &amp; Motorcycle Guides
        </h1>
        <p className="text-[var(--text-light-secondary)] text-base leading-relaxed max-w-2xl">
          Practical guides on buying, riding, and owning scooters and motorcycles in Perth and Western Australia.
        </p>
      </div>

      <div className="divide-y divide-stone-800">
        {articles.map((article) => (
          <article key={article.slug} className="py-8 group">
            <Link href={`/blog/${article.slug}`} className="block">
              <h2 className="text-xl font-semibold text-[var(--text-light-primary)] group-hover:text-[var(--highlight)] transition-colors duration-200 mb-3">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-[var(--text-light-secondary)] text-sm leading-relaxed mb-4 max-w-2xl">
                  {article.excerpt}
                </p>
              )}
              <span className="text-[var(--highlight)] text-sm font-medium">
                Read guide →
              </span>
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}

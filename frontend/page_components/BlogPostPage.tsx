import Link from 'next/link';
import type { Article } from '@/lib/articles';

interface Props {
  article: Article;
}

export default function BlogPostPage({ article }: Props) {
  return (
    <main className="container mx-auto px-6 py-16 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-light-secondary)] mb-10">
        <Link href="/" className="hover:text-[var(--highlight)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[var(--highlight)] transition-colors">Guides</Link>
        <span>/</span>
        <span className="text-[var(--text-light-primary)]">{article.title}</span>
      </nav>

      {/* Article */}
      <article>
        <div
          className="prose-article"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </article>

      {/* Back link */}
      <div className="mt-16 pt-8 border-t border-stone-800">
        <Link
          href="/blog"
          className="text-sm text-[var(--highlight)] hover:underline"
        >
          ← Back to all guides
        </Link>
      </div>
    </main>
  );
}

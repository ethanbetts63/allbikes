import Link from 'next/link';
import { FaqSection } from '@/components/FaqSection';
import type { Article } from '@/lib/articles';
import type { FaqItem } from '@/types/FaqItem';

interface Props {
  article: Article;
  faqs: FaqItem[];
}

export default function BlogPostPage({ article, faqs }: Props) {
  return (
    <main>
      <div className="container mx-auto px-6 py-16 max-w-3xl">
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
      </div>

      {faqs.length > 0 && (
        <FaqSection title="Frequently Asked Questions" faqData={faqs} />
      )}
    </main>
  );
}

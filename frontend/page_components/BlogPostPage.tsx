import Link from 'next/link';
import Hero from '@/components/Hero';
import { FaqSection } from '@/components/FaqSection';
import HeroImage from '@/assets/sym_22.webp';
import HeroImage320 from '@/assets/sym_22-320w.webp';
import HeroImage640 from '@/assets/sym_22-640w.webp';
import HeroImage768 from '@/assets/sym_22-768w.webp';
import HeroImage1024 from '@/assets/sym_22-1024w.webp';
import HeroImage1280 from '@/assets/sym_22-1280w.webp';
import type { Article } from '@/lib/articles';
import type { FaqItem } from '@/types/FaqItem';

interface Props {
  article: Article;
  faqs: FaqItem[];
}

export default function BlogPostPage({ article, faqs }: Props) {
  const srcSet = [
    `${HeroImage320.src} 320w`,
    `${HeroImage640.src} 640w`,
    `${HeroImage768.src} 768w`,
    `${HeroImage1024.src} 1024w`,
    `${HeroImage1280.src} 1280w`,
  ].join(', ');
  const publishedDate = new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${article.publishedDate}T00:00:00+08:00`));

  return (
    <>
      <Hero
        title={article.title}
        description={article.excerpt}
        imageUrl={HeroImage.src}
        imageSrcSet={srcSet}
        imageSizes="100vw"
        centered
      />

      <div className="bg-[var(--card)]">
        <div className="container mx-auto px-4 lg:px-8 py-10 max-w-3xl">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[var(--text-dark-primary)] mb-8">
            <Link href="/" className="hover:text-[var(--highlight)] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-[var(--highlight)] transition-colors">Guides</Link>
            <span>/</span>
            <span className="text-[var(--highlight)]">{article.title}</span>
          </nav>

          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--highlight)] mb-5">
            By {article.authorName} | Published <time dateTime={article.publishedDate}>{publishedDate}</time>
          </p>

          {/* Article */}
          <article
            className="prose-article"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-stone-200">
            <Link href="/blog" className="text-sm text-[var(--highlight)] hover:underline">
              ← Back to all guides
            </Link>
          </div>

        </div>
      </div>

      {faqs.length > 0 && (
        <FaqSection title="Frequently Asked Questions" faqData={faqs} />
      )}
    </>
  );
}

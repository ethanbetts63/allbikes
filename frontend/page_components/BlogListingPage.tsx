import Link from 'next/link';
import Hero from '@/components/Hero';
import HeroImage from '@/assets/sym_22.webp';
import HeroImage320 from '@/assets/sym_22-320w.webp';
import HeroImage640 from '@/assets/sym_22-640w.webp';
import HeroImage768 from '@/assets/sym_22-768w.webp';
import HeroImage1024 from '@/assets/sym_22-1024w.webp';
import HeroImage1280 from '@/assets/sym_22-1280w.webp';
import type { ArticleMeta } from '@/lib/articles';

interface Props {
  articles: ArticleMeta[];
}

export default function BlogListingPage({ articles }: Props) {
  const srcSet = [
    `${HeroImage320.src} 320w`,
    `${HeroImage640.src} 640w`,
    `${HeroImage768.src} 768w`,
    `${HeroImage1024.src} 1024w`,
    `${HeroImage1280.src} 1280w`,
  ].join(', ');
  const dateFormatter = new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <Hero
        title="Guides & Articles"
        description="Practical guides on buying, riding, and owning scooters and motorcycles in Perth and Western Australia."
        imageUrl={HeroImage.src}
        imageSrcSet={srcSet}
        imageSizes="100vw"
      />

      <div className="bg-[var(--card)]">
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {articles.map((article) => {
              const publishedDate = dateFormatter.format(
                new Date(`${article.publishedDate}T00:00:00+08:00`),
              );

              return (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group flex flex-col border border-stone-200 rounded-lg p-6 hover:border-[var(--highlight)] hover:shadow-sm transition-all duration-200 bg-white"
              >
                <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
                  By {article.authorName} | <time dateTime={article.publishedDate}>{publishedDate}</time>
                </p>
                <h2 className="text-lg font-semibold text-[var(--text-dark-primary)] group-hover:text-[var(--highlight)] transition-colors duration-200 mb-3 leading-snug">
                  {article.title}
                </h2>
                <p className="text-sm text-[var(--text-dark-secondary)] leading-relaxed mb-5 flex-1">
                  {article.excerpt}
                </p>
                <span className="text-sm font-medium text-[var(--highlight)]">
                  Read guide →
                </span>
              </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

import Link from 'next/link';
import Hero from '@/components/marketing/Hero';
import { FaqSection } from '@/components/marketing/FaqSection';
import HeroImage from '@/assets/sym_22.webp';
import type { Article } from '@/lib/articles';
import type { FaqItem } from '@/types/FaqItem';
import { notFound } from 'next/navigation';
import { getAllArticleSlugs, getArticleBySlug } from '@/lib/articles';
import { getArticleFaqs } from '@/app/blog/[slug]/_lib/articleFaqs';
import { getArticlePageMeta } from '@/lib/articleMeta';
import { buildMetadata, buildArticleSchema, buildFaqSchema, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return buildMetadata({ title: 'Not Found', noindex: true });

  const pageMeta = getArticlePageMeta(slug);
  const title = pageMeta?.title ?? article.title;
  const description = pageMeta?.description ?? article.excerpt;

  return {
    ...buildMetadata({
      title,
      description,
      canonicalPath: `/blog/${slug}`,
    }),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/${slug}`,
      type: 'article',
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const faqs = getArticleFaqs(slug);

  const structuredData = [
    buildArticleSchema({
      title: article.title,
      description: article.excerpt,
      slug,
      authorName: article.authorName,
      datePublished: article.publishedDate,
      dateModified: article.lastModified,
    }),
    buildFaqSchema(faqs),
  ].filter(Boolean) as object[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BlogPostPage article={article} faqs={faqs} />
    </>
  );
}

interface Props {
  article: Article;
  faqs: FaqItem[];
}

function BlogPostPage({ article, faqs }: Props) {
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
        image={HeroImage}
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

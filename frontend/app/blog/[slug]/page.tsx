import { notFound } from 'next/navigation';
import { getAllArticleSlugs, getArticleBySlug } from '@/lib/articles';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import BlogPostPage from '@/page_components/BlogPostPage';
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

  return {
    ...buildMetadata({
      title: `${article.title} | ScooterShop`,
      description: article.excerpt,
      canonicalPath: `/blog/${slug}`,
    }),
    openGraph: {
      title: article.title,
      description: article.excerpt,
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

  return <BlogPostPage article={article} />;
}

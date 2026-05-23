import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { getArticlePageMeta } from '@/lib/articleMeta';

const ARTICLES_DIR = path.join(process.cwd(), '../_docs/articles');
const EXCLUDED = new Set(['overview.md']);

export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt: string;
  lastModified: string;
}

export interface Article extends ArticleMeta {
  html: string;
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '');
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

function extractExcerpt(markdown: string): string {
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---') && !trimmed.startsWith('|')) {
      return trimmed.slice(0, 160).replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }
  }
  return '';
}

function rewriteLinks(markdown: string): string {
  return markdown.replace(/\(\/articles\//g, '(/blog/');
}

function articleFilenames(): string[] {
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.md') && !EXCLUDED.has(f))
    .sort();
}

export function getAllArticleMeta(): ArticleMeta[] {
  return articleFilenames().map((filename) => {
    const slug = slugFromFilename(filename);
    const filepath = path.join(ARTICLES_DIR, filename);
    const raw = fs.readFileSync(filepath, 'utf-8');
    const stat = fs.statSync(filepath);

    const pageMeta = getArticlePageMeta(slug);
    return {
      slug,
      title: extractTitle(raw),
      excerpt: pageMeta?.description ?? extractExcerpt(raw),
      lastModified: stat.mtime.toISOString().split('T')[0],
    };
  });
}

export function getAllArticleSlugs(): string[] {
  return articleFilenames().map(slugFromFilename);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const filename = `${slug}.md`;
  if (EXCLUDED.has(filename)) return null;

  const filepath = path.join(ARTICLES_DIR, filename);
  if (!fs.existsSync(filepath)) return null;

  const raw = fs.readFileSync(filepath, 'utf-8');
  const stat = fs.statSync(filepath);
  const rewritten = rewriteLinks(raw);

  const html = await marked(rewritten, { gfm: true });
  const pageMeta = getArticlePageMeta(slug);

  return {
    slug,
    title: extractTitle(raw),
    excerpt: pageMeta?.description ?? extractExcerpt(raw),
    lastModified: stat.mtime.toISOString().split('T')[0],
    html,
  };
}

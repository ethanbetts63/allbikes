import { buildWebPageStructuredData } from '@/lib/seo';
import type { SeoProps } from '@/types/SeoProps';

const Seo = ({ structuredData, dateModified }: SeoProps) => {
  const pageStructuredData = dateModified
    ? buildWebPageStructuredData({ title, description, canonicalPath, dateModified })
    : null;

  const payload = pageStructuredData
    ? (structuredData ? [pageStructuredData, ...normalizeStructuredData(structuredData)] : pageStructuredData)
    : structuredData;

  if (!payload) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
};

function normalizeStructuredData(structuredData: object | object[]): object[] {
  return Array.isArray(structuredData) ? structuredData : [structuredData];
}

export default Seo;

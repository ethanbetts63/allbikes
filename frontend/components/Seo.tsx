import type { SeoProps } from '@/types/SeoProps';

const Seo = ({ structuredData }: SeoProps) => {
  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export default Seo;

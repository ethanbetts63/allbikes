import type { StructuredDataScriptProps } from '@/types/StructuredDataScriptProps';

const StructuredDataScript = ({ structuredData }: StructuredDataScriptProps) => {
  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export default StructuredDataScript;

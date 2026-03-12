import { Helmet } from 'react-helmet-async';

import type { SeoProps } from '@/types/SeoProps';

const Seo = ({ title, description, canonicalPath, ogType = 'website', ogImage, noindex, structuredData }: SeoProps) => {
  const siteUrl = 'https://www.scootershop.com.au';
  const canonicalUrl = canonicalPath ? `${siteUrl}${canonicalPath}` : undefined;
  const imageUrl = ogImage ? `${siteUrl}${ogImage}` : `${siteUrl}/logo-192x192.png`;

  const defaultOrganizationSchema = {
    "@type": "Organization",
    "name": "Allbikes & Scooters",
    "url": siteUrl,
    "logo": `${siteUrl}/logo-512x512.png`,
    "owner": {
      "@type": "Person",
      "name": "Ethan Betts"
    }
  };

  let finalStructuredData;

  if (structuredData) {
    if (structuredData['@graph']) {
      // If there's already a graph, push the organization schema into it
      finalStructuredData = {
        ...structuredData,
        '@graph': [...structuredData['@graph'], defaultOrganizationSchema]
      };
    } else {
      // If it's a single schema, create a graph with both
      finalStructuredData = {
        "@context": "https://schema.org",
        "@graph": [structuredData, defaultOrganizationSchema]
      };
    }
  } else {
    // If no page-specific data, just use the organization schema
    finalStructuredData = {
      "@context": "https://schema.org",
      ...defaultOrganizationSchema
    };
  }


  return (
    <Helmet>
      {/* Standard SEO */}
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph Tags (Facebook, etc.) */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={imageUrl} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={imageUrl} />

      {/* Render structured data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};

export default Seo;

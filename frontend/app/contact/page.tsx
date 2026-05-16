import StructuredDataScript from '@/components/StructuredDataScript';
import { siteSettings } from '@/config/siteSettings';
import { buildLocalBusinessSchema, buildMetadata, SITE_URL } from '@/lib/seo';
import ContactPage from '@/page_components/ContactPage';

export const metadata = buildMetadata({
  title: 'Contact Us | ScooterShop',
  description: 'Contact ScooterShop in Dianella, Perth for motorcycle and scooter sales, servicing, tyre fitting, and workshop enquiries.',
  canonicalPath: '/contact',
});

const contactPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  url: `${SITE_URL}/contact`,
  name: 'Contact ScooterShop',
  description: 'Contact ScooterShop in Dianella, Perth for motorcycle and scooter sales, servicing, tyre fitting, and workshop enquiries.',
  about: {
    '@id': `${SITE_URL}/#business`,
  },
};

const structuredData = [
  buildLocalBusinessSchema(siteSettings),
  contactPageSchema,
];

export default function Page() {
  return (
    <>
      <StructuredDataScript structuredData={structuredData} />
      <ContactPage />
    </>
  );
}

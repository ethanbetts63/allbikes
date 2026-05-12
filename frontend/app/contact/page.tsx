import { buildMetadata, SITE_URL } from '@/lib/seo';
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
    '@type': 'Organization',
    '@id': `${SITE_URL}/#business`,
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <ContactPage />
    </>
  );
}

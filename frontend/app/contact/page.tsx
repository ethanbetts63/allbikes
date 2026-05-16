import StructuredDataScript from '@/components/StructuredDataScript';
import { siteSettings } from '@/config/siteSettings';
import { contactFaqData } from '@/data/contactFaqs';
import { buildFaqSchema, buildLocalBusinessSchema, buildContactPageSchema, buildMetadata } from '@/lib/seo';
import ContactPage from '@/page_components/ContactPage';

export const metadata = buildMetadata({
  title: 'Contact Us | ScooterShop',
  description: 'Contact ScooterShop in Dianella, Perth for motorcycle and scooter sales, servicing, tyre fitting, and workshop enquiries.',
  canonicalPath: '/contact',
});

const structuredData = [
  buildLocalBusinessSchema(siteSettings),
  buildContactPageSchema(),
  buildFaqSchema(contactFaqData),
].filter(Boolean) as object[];

export default function Page() {
  return (
    <>
      <StructuredDataScript structuredData={structuredData} />
      <ContactPage />
    </>
  );
}

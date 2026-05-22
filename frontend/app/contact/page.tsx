import StructuredDataScript from '@/components/StructuredDataScript';
import { siteSettings } from '@/config/siteSettings';
import { contactFaqData } from '@/data/contactFaqs';
import { buildFaqSchema, buildLocalBusinessSchema, buildContactPageSchema, buildMetadata } from '@/lib/seo';
import ContactPage from '@/page_components/ContactPage';

export const metadata = buildMetadata({
  title: 'Contact Motorcycle & Scooter Workshop Perth',
  description: 'Contact the Dianella workshop for motorcycle and scooter sales, servicing, tyre fitting, hire, and general enquiries.',
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

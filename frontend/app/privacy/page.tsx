import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'Read how personal information provided through this website is collected, used, stored, and protected.',
  canonicalPath: '/privacy',
});

export { default } from '@/page_components/PrivacyPolicyPage';

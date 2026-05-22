import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Security Policy',
  description: 'Security policy covering electronic and hard-copy data protection practices, access controls, backups, and incident handling.',
  canonicalPath: '/security',
});

export { default } from '@/page_components/SecurityPolicyPage';

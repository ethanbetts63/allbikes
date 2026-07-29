import { buildMetadata } from '@/lib/seo';

import LoginScreen from './_components/LoginScreen';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Admin Login',
  noindex: true,
});

// Stays a Server Component: `metadata` cannot be exported from a Client
// Component, so the interactive body lives in _components.
export default function Page() {
  return <LoginScreen />;
}

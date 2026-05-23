import AdminLayout from '@/page_components/admin/AdminLayout';
import { AuthProvider } from '@/context/AuthContext';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Admin',
  noindex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><AdminLayout>{children}</AdminLayout></AuthProvider>;
}

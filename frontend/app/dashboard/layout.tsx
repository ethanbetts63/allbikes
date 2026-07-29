import AdminLayout from './_components/AdminLayout';
import { AuthProvider } from '@/app/dashboard/_components/AuthContext';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Admin',
  noindex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><AdminLayout>{children}</AdminLayout></AuthProvider>;
}

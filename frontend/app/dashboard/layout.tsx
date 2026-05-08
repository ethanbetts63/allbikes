import AdminLayout from '@/pages_vite/admin/AdminLayout';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Admin | ScooterShop',
  noindex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

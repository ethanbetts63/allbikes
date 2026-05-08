import AdminLayout from '@/page_components/admin/AdminLayout';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Admin | ScooterShop',
  noindex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

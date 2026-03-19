import { useState, useEffect } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import Seo from '@/components/Seo';
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  ClipboardList,
  Mail,
  CalendarCheck,
  Settings,
  Tag,
  LogOut,
  Gauge,
} from 'lucide-react';
import { adminGetDashboard, logoutUser } from '@/api';
import type { AdminDashboard } from '@/types/AdminDashboard';

const NavBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-4">
      {count}
    </span>
  ) : null;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-light-primary)]/30 px-3 pt-5 pb-1 select-none">
    {children}
  </p>
);

const AdminLayout = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    adminGetDashboard().then(setDashboard).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const navItem = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-white/10 text-[var(--highlight)] font-semibold'
        : 'text-[var(--text-light-secondary)] hover:bg-white/5 hover:text-[var(--text-light-primary)]'
    }`;

  const subNavItem = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 w-full pl-8 pr-3 py-1.5 rounded-md text-sm transition-colors ${
      isActive
        ? 'text-[var(--highlight)] font-semibold'
        : 'text-[var(--text-light-secondary)]/60 hover:text-[var(--text-light-primary)]'
    }`;

  if (isAuthLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (!user?.is_staff) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Seo title="Admin | ScooterShop" noindex={true} />
      <div className="flex min-h-screen">

        {/* Sidebar — hidden on mobile, shown from md up */}
        <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-foreground text-[var(--text-light-primary)] border-r border-white/10">

          {/* Brand */}
          <div className="px-4 py-5 border-b border-white/10">
            <p className="text-base font-black uppercase tracking-widest text-[var(--text-light-primary)]">ScooterShop</p>
            <p className="text-xs text-[var(--text-light-secondary)]/50 mt-0.5">Admin Panel</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto">

            <NavLink to="/dashboard" end className={navItem}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Dashboard
            </NavLink>

            <SectionLabel>Inventory</SectionLabel>
            <NavLink to="/dashboard/inventory" className={navItem}>
              <Gauge className="h-4 w-4 shrink-0" />
              <span className="flex-1">Inventory</span>
              <NavBadge count={dashboard?.reserved_bikes.length ?? 0} />
            </NavLink>
            <NavLink to="/dashboard/add-motorcycle" className={subNavItem}>
              <PlusCircle className="h-3.5 w-3.5 shrink-0" />
              Add Motorcycle
            </NavLink>

            <SectionLabel>Shop</SectionLabel>
            <NavLink to="/dashboard/orders" className={navItem}>
              <ClipboardList className="h-4 w-4 shrink-0" />
              <span className="flex-1">Orders</span>
              <NavBadge count={dashboard?.paid_orders.length ?? 0} />
            </NavLink>
            <NavLink to="/dashboard/products" className={navItem}>
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="flex-1">Products</span>
              <NavBadge count={dashboard?.attention_products.length ?? 0} />
            </NavLink>
            <NavLink to="/dashboard/products/new" className={subNavItem}>
              <PlusCircle className="h-3.5 w-3.5 shrink-0" />
              Add Product
            </NavLink>

            <SectionLabel>Service</SectionLabel>
            <NavLink to="/dashboard/service-bookings" className={navItem}>
              <CalendarCheck className="h-4 w-4 shrink-0" />
              Bookings
            </NavLink>
            <NavLink to="/dashboard/service-settings" className={navItem}>
              <Settings className="h-4 w-4 shrink-0" />
              Service Settings
            </NavLink>
            <NavLink to="/dashboard/job-types" className={navItem}>
              <Tag className="h-4 w-4 shrink-0" />
              Job Types
            </NavLink>

            <SectionLabel>Comms</SectionLabel>
            <NavLink to="/dashboard/messages" className={navItem}>
              <Mail className="h-4 w-4 shrink-0" />
              Messages
            </NavLink>

          </nav>

          {/* User / Logout */}
          <div className="px-3 py-4 border-t border-white/10">
            <p className="text-xs text-[var(--text-light-secondary)]/50 truncate mb-2 px-1">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email}
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-[var(--text-light-secondary)] hover:bg-white/5 hover:text-[var(--text-light-primary)] transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log out
            </button>
          </div>

        </aside>

        {/* Main Content */}
        <main className="flex-grow min-w-0 bg-card overflow-x-hidden">
          <Outlet />
        </main>

      </div>
    </>
  );
};

export default AdminLayout;

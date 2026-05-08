"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
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
  Key,
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

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    if (!user?.is_staff) return;
    adminGetDashboard().then(setDashboard).catch(() => {});
  }, [user?.is_staff]);

  useEffect(() => {
    if (!isAuthLoading && !user?.is_staff) {
      router.push('/login');
    }
  }, [isAuthLoading, user]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  const navItemClass = (href: string, end = false) => {
    const isActive = end ? pathname === href : pathname.startsWith(href);
    return `flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-white/10 text-[var(--highlight)] font-semibold'
        : 'text-[var(--text-light-secondary)] hover:bg-white/5 hover:text-[var(--text-light-primary)]'
    }`;
  };

  const subNavItemClass = (href: string) => {
    const isActive = pathname.startsWith(href);
    return `flex items-center gap-3 w-full pl-8 pr-3 py-1.5 rounded-md text-sm transition-colors ${
      isActive
        ? 'text-[var(--highlight)] font-semibold'
        : 'text-[var(--text-light-secondary)]/60 hover:text-[var(--text-light-primary)]'
    }`;
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (!user?.is_staff) {
    return null;
  }

  return (
    <>
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

            <Link href="/dashboard" className={navItemClass('/dashboard', true)}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Dashboard
            </Link>

            <SectionLabel>Inventory</SectionLabel>
            <Link href="/dashboard/inventory" className={navItemClass('/dashboard/inventory')}>
              <Gauge className="h-4 w-4 shrink-0" />
              <span className="flex-1">Inventory</span>
              <NavBadge count={dashboard?.reserved_bikes.length ?? 0} />
            </Link>
            <Link href="/dashboard/add-motorcycle" className={subNavItemClass('/dashboard/add-motorcycle')}>
              <PlusCircle className="h-3.5 w-3.5 shrink-0" />
              Add Motorcycle
            </Link>

            <SectionLabel>Shop</SectionLabel>
            <Link href="/dashboard/orders" className={navItemClass('/dashboard/orders')}>
              <ClipboardList className="h-4 w-4 shrink-0" />
              <span className="flex-1">Orders</span>
              <NavBadge count={dashboard?.paid_orders.length ?? 0} />
            </Link>
            <Link href="/dashboard/products" className={navItemClass('/dashboard/products')}>
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="flex-1">Products</span>
              <NavBadge count={dashboard?.attention_products.length ?? 0} />
            </Link>
            <Link href="/dashboard/products/new" className={subNavItemClass('/dashboard/products/new')}>
              <PlusCircle className="h-3.5 w-3.5 shrink-0" />
              Add Product
            </Link>

            <SectionLabel>Service</SectionLabel>
            <Link href="/dashboard/service-bookings" className={navItemClass('/dashboard/service-bookings')}>
              <CalendarCheck className="h-4 w-4 shrink-0" />
              Bookings
            </Link>
            <Link href="/dashboard/service-settings" className={navItemClass('/dashboard/service-settings')}>
              <Settings className="h-4 w-4 shrink-0" />
              Service Settings
            </Link>
            <Link href="/dashboard/job-types" className={navItemClass('/dashboard/job-types')}>
              <Tag className="h-4 w-4 shrink-0" />
              Job Types
            </Link>

            <SectionLabel>Hire</SectionLabel>
            <Link href="/dashboard/hire" className={navItemClass('/dashboard/hire')}>
              <Key className="h-4 w-4 shrink-0" />
              <span className="flex-1">Hire Bookings</span>
              <NavBadge count={dashboard?.active_hire_bookings.length ?? 0} />
            </Link>
            <Link href="/dashboard/hire-settings" className={navItemClass('/dashboard/hire-settings')}>
              <Settings className="h-4 w-4 shrink-0" />
              Hire Settings
            </Link>
            <Link href="/dashboard/hire-extras" className={navItemClass('/dashboard/hire-extras')}>
              <Tag className="h-4 w-4 shrink-0" />
              Extras
            </Link>
            <Link href="/dashboard/hire-blocked-dates" className={navItemClass('/dashboard/hire-blocked-dates')}>
              <CalendarCheck className="h-4 w-4 shrink-0" />
              Blocked Dates
            </Link>

            <SectionLabel>Comms</SectionLabel>
            <Link href="/dashboard/messages" className={navItemClass('/dashboard/messages')}>
              <Mail className="h-4 w-4 shrink-0" />
              Messages
            </Link>

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
          {children}
        </main>

      </div>
    </>
  );
};

export default AdminLayout;

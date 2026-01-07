import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Seo from '@/components/Seo';
import { LayoutDashboard, Wrench, PlusSquare, Settings } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full justify-start flex items-center gap-2 ${isActive ? 'bg-muted text-primary' : 'hover:bg-muted/50'}`;

  if (isAuthLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // This is a protected route. If the user is not a staff member, redirect them.
  if (!user?.is_staff) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Seo title="Admin | Allbikes" noindex={true} />
      <div className="flex h-screen">
        {/* Vertical Nav */}
        <aside className="w-64 flex-shrink-0 border-r p-4 bg-foreground text-[var(--text-primary)]">
          <nav className="flex flex-col space-y-2">
            <h2 className="text-lg font-semibold tracking-tight mb-2 px-2">Admin Menu</h2>

            <Button asChild variant="ghost">
              <NavLink to="/admin/inventory" className={getNavLinkClass}>
                <Wrench className="h-4 w-4" />
                Inventory Management
              </NavLink>
            </Button>
            <Button asChild variant="ghost">
              <NavLink to="/admin/add-motorcycle" className={getNavLinkClass}>
                <PlusSquare className="h-4 w-4" />
                Add Motorcycle
              </NavLink>
            </Button>
            <Button asChild variant="ghost">
              <NavLink to="/admin/settings" className={getNavLinkClass}>
                <Settings className="h-4 w-4" />
                Site Settings
              </NavLink>
            </Button>
            <Button asChild variant="ghost">
              <NavLink to="/admin/service-settings" className={getNavLinkClass}>
                <Wrench className="h-4 w-4" />
                Service Settings
              </NavLink>
            </Button>
            <Button asChild variant="ghost">
              <NavLink to="/admin/job-types" className={getNavLinkClass}>
                <Wrench className="h-4 w-4" />
                Job Types
              </NavLink>
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-grow border-l p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default AdminLayout;

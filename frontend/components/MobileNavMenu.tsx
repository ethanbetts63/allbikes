"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { siteSettings } from "@/config/siteSettings";
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/api";

const NAV_LINK = "text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest hover:text-[var(--highlight)] transition-colors duration-200";

const MobileNavMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await logoutUser();
    setIsMenuOpen(false);
    router.push("/login");
  };

  const activeLink = (href: string, end = false) => {
    const isActive = end ? pathname === href : pathname.startsWith(href);
    return isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK;
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden self-center p-1.5 text-[var(--text-light-primary)] hover:text-[var(--highlight)] transition-colors duration-200"
        aria-label="Toggle navigation menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isMenuOpen && (
        <div ref={menuRef} className="absolute left-0 right-0 top-full md:hidden bg-background border-t border-white/10">
          <nav className="flex flex-col px-6 py-4 gap-5">
            <Link href="/inventory/motorcycles/new" className={NAV_LINK}>New Motorcycles &amp; Scooters</Link>
            <Link href="/inventory/motorcycles/used" className={NAV_LINK}>Used Motorcycles &amp; Scooters</Link>
            {!siteSettings.hide_escooters && <Link href="/escooters" className={NAV_LINK}>E-Scooters</Link>}
            {siteSettings.show_workshop_clearance && <Link href="/inventory/motorcycles/parts" className={NAV_LINK}>Workshop Clearance</Link>}
            {siteSettings.show_hire && <Link href="/hire" className={NAV_LINK}>Hire</Link>}
            <Link href="/service" className={NAV_LINK}>Servicing</Link>
            <Link href="/contact" className={NAV_LINK}>Contact Us</Link>

            {user?.is_staff && (
              <div className="border-t border-white/10 pt-5 flex flex-col gap-5">
                <Link href="/dashboard" className={activeLink("/dashboard", true)}>Dashboard</Link>
                <Link href="/dashboard/inventory" className={activeLink("/dashboard/inventory")}>Inventory</Link>
                <Link href="/dashboard/add-motorcycle" className={activeLink("/dashboard/add-motorcycle")}>Add Motorcycle</Link>
                <Link href="/dashboard/orders" className={activeLink("/dashboard/orders")}>Orders</Link>
                <Link href="/dashboard/products" className={activeLink("/dashboard/products")}>Products</Link>
                <Link href="/dashboard/products/new" className={activeLink("/dashboard/products/new", true)}>Add Product</Link>
                <Link href="/dashboard/service-bookings" className={activeLink("/dashboard/service-bookings")}>Bookings</Link>
                <Link href="/dashboard/service-settings" className={activeLink("/dashboard/service-settings")}>Service Settings</Link>
                <Link href="/dashboard/job-types" className={activeLink("/dashboard/job-types")}>Job Types</Link>
                <Link href="/dashboard/messages" className={activeLink("/dashboard/messages")}>Messages</Link>
                <button onClick={handleLogout} className={`${NAV_LINK} text-left`}>Log Out</button>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default MobileNavMenu;

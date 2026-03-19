import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logo320 from '../assets/logo-320w.webp';
import logo640 from '../assets/logo-640w.webp';
import logo768 from '../assets/logo-768w.webp';
import logo1024 from '../assets/logo-1024w.webp';
import logo1280 from '../assets/logo-1280w.webp';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { siteSettings } from '@/config/siteSettings';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/api';
import { useNavigate } from 'react-router-dom';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

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
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await logoutUser();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const NAV_LINK = 'text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest hover:text-[var(--highlight)] transition-colors duration-200';


  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-white/10">
      {/* Banner — hidden when mobile menu is open */}
      {!isMenuOpen && siteSettings.enable_banner && siteSettings.banner_text && (
        <div className="bg-highlight text-[var(--text-dark-primary)] py-2 px-4">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            <p className="text-xs sm:text-sm font-semibold text-center leading-snug">
              {siteSettings.banner_text}
            </p>
          </div>
        </div>
      )}
      <div className="container flex h-20 items-stretch justify-between px-6">

        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-stretch">
          <img
            src={logo1280}
            srcSet={`${logo320} 320w, ${logo640} 640w, ${logo768} 768w, ${logo1024} 1024w, ${logo1280} 1280w`}
            sizes="175px"
            width="1756"
            height="810"
            alt="Allbikes Logo"
            className="h-full w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10 self-center ml-auto">
          <Link to="/inventory/motorcycles/new" className={NAV_LINK}>New Bikes</Link>
          <Link to="/inventory/motorcycles/used" className={NAV_LINK}>Used Bikes</Link>
          {!siteSettings.hide_escooters && <Link to="/escooters" className={NAV_LINK}>E-Scooters</Link>}
          {siteSettings.show_workshop_clearance && <Link to="/inventory/motorcycles/parts" className={NAV_LINK}>Workshop Clearance</Link>}
          <Link to="/service" className={NAV_LINK}>Servicing</Link>
          <Link to="/contact" className={cn(NAV_LINK, 'border border-white/30 px-4 py-2 hover:border-amber-400')}>
            Contact Us
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden self-center p-1.5 text-[var(--text-light-primary)] hover:text-[var(--highlight)] transition-colors duration-200"
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden bg-background border-t border-white/10">
          {/* Public mobile nav — always shown */}
          <nav className="flex flex-col px-6 py-4 gap-5">
            <Link to="/inventory/motorcycles/new" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>New Motorcycles &amp; Scooters</Link>
            <Link to="/inventory/motorcycles/used" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>Used Motorcycles &amp; Scooters</Link>
            {!siteSettings.hide_escooters && <Link to="/escooters" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>E-Scooters</Link>}
            {siteSettings.show_workshop_clearance && <Link to="/inventory/motorcycles/parts" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>Workshop Clearance</Link>}
            <Link to="/service" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>Servicing</Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>Contact Us</Link>

            {/* Admin links — only shown to staff */}
            {user?.is_staff && (
              <div className="border-t border-white/10 pt-5 flex flex-col gap-5">
                <NavLink to="/dashboard" end className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Dashboard</NavLink>
                <NavLink to="/dashboard/inventory" className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Inventory</NavLink>
                <NavLink to="/dashboard/add-motorcycle" className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Add Motorcycle</NavLink>
                <NavLink to="/dashboard/orders" className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Orders</NavLink>
                <NavLink to="/dashboard/products" className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Products</NavLink>
                <NavLink to="/dashboard/products/new" className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Add Product</NavLink>
                <NavLink to="/dashboard/service-bookings" className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Bookings</NavLink>
                <NavLink to="/dashboard/service-settings" className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Service Settings</NavLink>
                <NavLink to="/dashboard/job-types" className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Job Types</NavLink>
                <NavLink to="/dashboard/messages" className={({ isActive }) => isActive ? `${NAV_LINK} text-[var(--highlight)]` : NAV_LINK} onClick={() => setIsMenuOpen(false)}>Messages</NavLink>
                <button onClick={handleLogout} className={NAV_LINK + ' text-left'}>Log Out</button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;

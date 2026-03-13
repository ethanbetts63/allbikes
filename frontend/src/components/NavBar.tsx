import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo320 from '../assets/logo-320w.webp';
import logo640 from '../assets/logo-640w.webp';
import logo768 from '../assets/logo-768w.webp';
import logo1024 from '../assets/logo-1024w.webp';
import logo1280 from '../assets/logo-1280w.webp';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // Ref for the mobile menu panel
  const buttonRef = useRef<HTMLButtonElement>(null); // Ref for the hamburger button

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close menu if click is outside the menu panel and not on the toggle button
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

  const NAV_LINK = 'text-white text-xs font-bold uppercase tracking-widest hover:text-amber-400 transition-colors duration-200';

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-white/10">
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
        <nav className="hidden md:flex items-center gap-8 self-center">
          <Link to="/inventory/motorcycles/new" className={NAV_LINK}>
            <span className="hidden lg:inline">New Motorcycles &amp; Scooters</span>
            <span className="lg:hidden">New Bikes</span>
          </Link>
          <Link to="/inventory/motorcycles/used" className={NAV_LINK}>
            <span className="hidden lg:inline">Used Motorcycles &amp; Scooters</span>
            <span className="lg:hidden">Used Bikes</span>
          </Link>
          <Link to="/escooters" className={NAV_LINK}>E-Scooters</Link>
          <Link to="/service" className={NAV_LINK}>Servicing</Link>
          <Link to="/contact" className={cn(NAV_LINK, 'border border-white/30 px-4 py-2 hover:border-amber-400')}>
            Contact Us
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden self-center p-1.5 text-white hover:text-amber-400 transition-colors duration-200"
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden bg-background border-t border-white/10">
          <nav className="flex flex-col px-6 py-4 gap-5">
            <Link to="/inventory/motorcycles/new" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>New Motorcycles &amp; Scooters</Link>
            <Link to="/inventory/motorcycles/used" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>Used Motorcycles &amp; Scooters</Link>
            <Link to="/escooters" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>E-Scooters</Link>
            <Link to="/service" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>Servicing</Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className={NAV_LINK}>Contact Us</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;

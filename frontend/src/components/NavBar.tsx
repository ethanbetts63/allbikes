import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';
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

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-foreground bg-background transition-all duration-300"
    )}>
      <div className="container flex h-20 items-center justify-between">
        {/* Left Section: Logo - Remains constant */}
        <div className="flex items-center p-8">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Allbikes Logo"
              className="h-20 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Center Section: Desktop & Tablet Navigation */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-4 px-4 text-[var(--text-primary)] text-bold text-lg">
          <ul className="flex items-center space-x-8 lg:space-x-24">
            <li>
              <Link to="/inventory/motorcycles/new" className="hover:text-secondary">
                <span className="hidden lg:inline">New Motorcycles and Scooters</span>
                <span className="lg:hidden">New Bikes</span>
              </Link>
            </li>
            <li>
              <Link to="/inventory/motorcycles/used" className="hover:text-secondary">
                <span className="hidden lg:inline">Used Motorcycles and Scooters</span>
                <span className="lg:hidden">Used Bikes</span>
              </Link>
            </li>
            <li>
              <Link to="/service" className="hover:text-secondary">
                 Servicing
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-secondary">
                 Contact Us
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right Section: Hamburger Menu for Mobile */}
        <div className="flex items-center md:hidden">
          <button ref={buttonRef} onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
            {isMenuOpen ? <X size={28} className="text-destructive" /> : <Menu size={28} className="text-primary" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden bg-background border-t border-foreground">
          <nav className="flex flex-col items-center gap-4 py-4 text-[var(--text-primary)] text-bold text-lg">
            <Link to="/inventory/motorcycles/new" onClick={() => setIsMenuOpen(false)} className="font-bold hover:text-secondary">New Motorcycles and Scooters</Link>
            <Link to="/inventory/motorcycles/used" onClick={() => setIsMenuOpen(false)} className="font-bold hover:text-secondary">Used Motorcycles and Scooters</Link>
            <Link to="/service" onClick={() => setIsMenuOpen(false)} className="font-bold hover:text-secondary">Workshop</Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="font-bold hover:text-secondary">Contact Us</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <Link to="/bikes/new">
                <span className="hidden lg:inline">New Motorcycles and Scooters</span>
                <span className="lg:hidden">New Bikes</span>
              </Link>
            </li>
            <li>
              <Link to="/bikes/used">
                <span className="hidden lg:inline">Used Motorcycles and Scooters</span>
                <span className="lg:hidden">Used Bikes</span>
              </Link>
            </li>
            <li>
              <Link to="/workshop">
                 Workshop
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right Section: Hamburger Menu for Mobile */}
        <div className="flex items-center md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-foreground">
          <nav className="flex flex-col items-center gap-4 py-4 text-[var(--text-primary)] text-bold text-lg">
            <Link to="/bikes/new" onClick={() => setIsMenuOpen(false)}>New Motorcycles and Scooters</Link>
            <Link to="/bikes/used" onClick={() => setIsMenuOpen(false)}>Used Motorcycles and Scooters</Link>
            <Link to="/workshop" onClick={() => setIsMenuOpen(false)}>Workshop</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;

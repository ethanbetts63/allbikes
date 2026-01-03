import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.webp';
import { cn } from '@/lib/utils'; // Assuming this path is correct for your cn utility

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300"
    )}>
      <div className="container flex h-20 items-center justify-between">
        {/* Left Section: Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="Allbikes Logo" 
              className="h-20 w-auto object-contain" 
            />
          </Link>
        </div>

        {/* Center Section: Navigation Links */}
        <nav className="flex-1 flex justify-center gap-4 px-4">
          <ul className="flex space-x-4">
            <li>
                              <Link
                                to="/bikes/new"
                                className="text-[var(--text-primary)]"
                              >
                                New Bikes
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/bikes/used"
                                className="text-[var(--text-primary)]"
                              >
                                Used Bikes
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/workshop"
                                className="text-[var(--text-primary)]"
                              >
                                Workshop
                              </Link>            </li>
          </ul>
        </nav>

        {/* Right Section: Empty for now, can add auth buttons later */}
        <div className="flex items-center justify-end gap-2 px-4">
        </div>
      </div>
    </header>
  );
};

export default NavBar;


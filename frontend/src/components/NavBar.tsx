import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';
import { cn } from '@/lib/utils'; // Assuming this path is correct for your cn utility

const NavBar = () => {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-foreground bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300"
    )}>
      <div className="container flex h-20 items-center justify-between">
        {/* Left Section: Logo */}
        <div className="flex items-center p-0">
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="Allbikes Logo" 
              className="h-20 w-auto object-contain" 
            />
          </Link>
        </div>

        {/* Center Section: Navigation Links */}
        <nav className="flex-1 flex justify-center gap-4 px-4 text-[var(--text-primary)] text-bold text-lg">
          <ul className="flex space-x-24">
            <li>
              <Link
                to="/bikes/new"
              >
                New Bikes
              </Link>
            </li>
            <li>
              <Link
                to="/bikes/used"
              >
                Used Bikes
              </Link>
            </li>
            <li>
              <Link
                to="/workshop"
              >
                Workshop
              </Link>
            </li>
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


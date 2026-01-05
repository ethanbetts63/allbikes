import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button'; 
import { useSiteSettings } from '@/context/SiteSettingsContext';

const Footer = () => {
  const { user, logout } = useAuth(); // Destructure logout from useAuth
  const { settings, loading } = useSiteSettings();

  return (
    <footer className="bg-foreground text-[var(--text-primary)] p-8 mt-auto">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-300">
        {/* Contact Info */}
        <div>
          <h4 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Contact Us</h4>
          {loading && <p>Loading contact information...</p>}
          {settings && (
            <>
              <p>{settings.street_address}</p>
              <p>{settings.address_locality}, {settings.address_region} {settings.postal_code}</p>
              <p>Phone: {settings.phone_number}</p>
              <p>Email: {settings.email_address}</p>
            </>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Quick Links</h4>
          <ul>
            <li className="mb-2">
              <Link to="/inventory/motorcycles/new" className="hover:underline text-gray-300">
                <span className="hidden md:inline">New Motorcycles and Scooters</span>
                <span className="md:hidden">New Bikes</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/inventory/motorcycles/used" className="hover:underline text-gray-300">
                <span className="hidden md:inline">Used Motorcycles and Scooters</span>
                <span className="md:hidden">Used Bikes</span>
              </Link>
            </li>
            <li className="mb-2"><Link to="/workshop" className="hover:underline text-gray-300">Workshop</Link></li>
            <li className="mb-2"><Link to="/terms" className="hover:underline text-gray-300">Terms and Conditions</Link></li>
            {user ? (
              <>
                {user.is_staff && (
                  <li className="mb-2">
                    <Link to="/admin/dashboard" className="hover:underline text-gray-300">Admin Dashboard</Link>
                  </li>
                )}
                <li className="mb-2">
                  <Button variant="link" onClick={logout} className="p-0 h-auto text-gray-300 hover:underline">Logout</Button>
                </li>
              </>
            ) : (
              <li className="mb-2">
                <Link to="/login" className="hover:underline text-gray-300">Login</Link>
              </li>
            )}
          </ul>
        </div>

        {/* Opening Hours & Business Info */}
        <div>
          <h4 className="font-bold text-lg mb-4 text-[var(--text-primary)]">Opening Hours</h4>
          {loading && <p>Loading opening hours...</p>}
          {settings && (
            <>
              <p>Monday: {settings.opening_hours_monday}</p>
              <p>Tuesday: {settings.opening_hours_tuesday}</p>
              <p>Wednesday: {settings.opening_hours_wednesday}</p>
              <p>Thursday: {settings.opening_hours_thursday}</p>
              <p>Friday: {settings.opening_hours_friday}</p>
              <p>Saturday: {settings.opening_hours_saturday}</p>
              <p>Sunday: {settings.opening_hours_sunday}</p>
            </>
          )}
        </div>
      </div>
      <div className="container mx-auto text-center mt-8 pt-4 border-t border-gray-700">
        <p className="text-gray-400">&copy; {new Date().getFullYear()} Allbikes. All rights reserved.</p>
        {settings && (
          <p className="text-sm mt-2 text-gray-400">
            ABN: {settings.abn_number} | MD: {settings.md_number} | MRB: {settings.mrb_number}
          </p>
        )}
      </div>
    </footer>
  );
};

export default Footer;



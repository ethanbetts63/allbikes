import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-gray-800 text-white p-4 mt-auto">
      <div className="container mx-auto text-center">
        <p className="mb-2">&copy; {new Date().getFullYear()} Allbikes. All rights reserved.</p>
        <div className="text-sm h-5"> {/* h-5 to prevent layout shift */}
          {user?.is_staff && (
            <Link to="/admin/dashboard" className="hover:underline">
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

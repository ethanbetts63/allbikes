import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button'; // Assuming button component is in the same folder or similar path

const Footer = () => {
  const { user, logout } = useAuth(); // Destructure logout from useAuth

  return (
    <footer className="bg-gray-800 text-white p-4 mt-auto">
      <div className="container mx-auto text-center">
        <p className="mb-2">&copy; {new Date().getFullYear()} Allbikes. All rights reserved.</p>
        <div className="flex justify-center space-x-4 text-sm h-5"> {/* Added flex and space-x-4 for layout */}
          {user ? ( // If user is authenticated
            <>
              {user.is_staff && ( // Show Admin Dashboard link if user is staff
                <Link to="/admin/dashboard" className="hover:underline">
                  Admin Dashboard
                </Link>
              )}
              <Button variant="link" onClick={logout} className="p-0 h-auto text-white hover:underline">
                Logout
              </Button>
            </>
          ) : ( // Otherwise, show Login link
            <Link to="/login" className="hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;


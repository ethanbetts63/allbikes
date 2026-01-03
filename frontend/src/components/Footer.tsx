import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button'; // Assuming button component is in the same folder or similar path
import { getFooterSettings, type FooterSettings } from '@/api/siteSettings'; // Import the new API function and interface

const Footer = () => {
  const { user, logout } = useAuth(); // Destructure logout from useAuth
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getFooterSettings();
        setFooterSettings(settings);
      } catch (err) {
        console.error("Failed to fetch footer settings:", err);
        setError("Failed to load footer information.");
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-gray-800 text-white p-8 mt-auto">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div>
          <h4 className="font-bold text-lg mb-4">Contact Us</h4>
          {error && <p className="text-red-400">{error}</p>}
          {footerSettings ? (
            <>
              <p>{footerSettings.street_address}</p>
              <p>{footerSettings.address_locality}, {footerSettings.address_region} {footerSettings.postal_code}</p>
              <p>Phone: {footerSettings.phone_number}</p>
              <p>Email: {footerSettings.email_address}</p>
            </>
          ) : (
            <p>Loading contact information...</p>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-lg mb-4">Quick Links</h4>
          <ul>
            <li className="mb-2"><Link to="/bikes/new" className="hover:underline">New Bikes</Link></li>
            <li className="mb-2"><Link to="/bikes/used" className="hover:underline">Used Bikes</Link></li>
            <li className="mb-2"><Link to="/workshop" className="hover:underline">Workshop</Link></li>
            {user ? (
              <>
                {user.is_staff && (
                  <li className="mb-2">
                    <Link to="/admin/dashboard" className="hover:underline">Admin Dashboard</Link>
                  </li>
                )}
                <li className="mb-2">
                  <Button variant="link" onClick={logout} className="p-0 h-auto text-white hover:underline">Logout</Button>
                </li>
              </>
            ) : (
              <li className="mb-2">
                <Link to="/login" className="hover:underline">Login</Link>
              </li>
            )}
          </ul>
        </div>

        {/* Opening Hours & Business Info */}
        <div>
          <h4 className="font-bold text-lg mb-4">Opening Hours</h4>
          {footerSettings ? (
            <>
              <p>Monday: {footerSettings.opening_hours_monday}</p>
              <p>Tuesday: {footerSettings.opening_hours_tuesday}</p>
              <p>Wednesday: {footerSettings.opening_hours_wednesday}</p>
              <p>Thursday: {footerSettings.opening_hours_thursday}</p>
              <p>Friday: {footerSettings.opening_hours_friday}</p>
              <p>Saturday: {footerSettings.opening_hours_saturday}</p>
              <p>Sunday: {footerSettings.opening_hours_sunday}</p>
              <p className="mt-4">ABN: {footerSettings.abn_number}</p>
              <p>MD: {footerSettings.md_number}</p>
              <p>MRB: {footerSettings.mrb_number}</p>
            </>
          ) : (
            <p>Loading opening hours...</p>
          )}
        </div>
      </div>
      <div className="container mx-auto text-center mt-8 pt-4 border-t border-gray-700">
        <p>&copy; {new Date().getFullYear()} Allbikes. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;



import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { siteSettings } from '@/config/siteSettings';
import stripeLogo from '@/assets/stripe-ar21.svg';

const LINK_CLASS = 'text-[var(--text-light-secondary)] hover:text-[var(--highlight)] transition-colors duration-200 text-sm';

const Footer = () => {
  const { user, logout } = useAuth();

  const phoneNumber = siteSettings.phone_number;
  const mobileNumber = siteSettings.mobile_number;
  const displayedPhone = phoneNumber && mobileNumber
    ? `${phoneNumber} / ${mobileNumber}`
    : phoneNumber || mobileNumber || null;

  const hours = [
    ['Mon', siteSettings.opening_hours_monday],
    ['Tue', siteSettings.opening_hours_tuesday],
    ['Wed', siteSettings.opening_hours_wednesday],
    ['Thu', siteSettings.opening_hours_thursday],
    ['Fri', siteSettings.opening_hours_friday],
    ['Sat', siteSettings.opening_hours_saturday],
    ['Sun', siteSettings.opening_hours_sunday],
  ];

  return (
    <footer className="bg-[var(--bg-dark-primary)]">
      <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Contact */}
        <div>
          <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-4">Contact Us</p>
          <div className="space-y-1.5 text-sm text-[var(--text-light-secondary)]">
            <p>{siteSettings.street_address}</p>
            <p>{siteSettings.address_locality}, {siteSettings.address_region} {siteSettings.postal_code}</p>
            {displayedPhone && <p className="pt-1">{displayedPhone}</p>}
            <p>{siteSettings.email_address}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-4">Quick Links</p>
          <ul className="space-y-2">
            <li><Link to="/inventory/motorcycles/new" className={LINK_CLASS}>New Motorcycles &amp; Scooters</Link></li>
            <li><Link to="/inventory/motorcycles/used" className={LINK_CLASS}>Used Motorcycles &amp; Scooters</Link></li>
            {!siteSettings.hide_escooters && <li><Link to="/escooters" className={LINK_CLASS}>E-Scooters</Link></li>}
            {!siteSettings.hide_escooters && <li><Link to="/electric-scooters" className={LINK_CLASS}>Buy E-Scooters Online</Link></li>}
            {siteSettings.show_workshop_clearance && <li><Link to="/inventory/motorcycles/parts" className={LINK_CLASS}>Workshop Clearance</Link></li>}
            {siteSettings.show_hire && <li><Link to="/hire" className={LINK_CLASS}>Hire a Motorcycle</Link></li>}
            <li><Link to="/service" className={LINK_CLASS}>Servicing</Link></li>
            <li><Link to="/tyre-fitting" className={LINK_CLASS}>Tyre Fitting</Link></li>
            <li><Link to="/contact" className={LINK_CLASS}>Contact Us</Link></li>
            <li><Link to="/refunds" className={LINK_CLASS}>Returns &amp; Refunds</Link></li>
            <li><Link to="/terms?type=purchase" className={LINK_CLASS}>Sales &amp; Deposit Terms</Link></li>
            {siteSettings.show_hire && <li><Link to="/terms?type=hire" className={LINK_CLASS}>Hire Terms</Link></li>}
            <li><Link to="/terms?type=service" className={LINK_CLASS}>Service Terms</Link></li>
            <li><Link to="/privacy" className={LINK_CLASS}>Privacy Policy</Link></li>
            <li><Link to="/security" className={LINK_CLASS}>Security Policy</Link></li>
            {user ? (
              <>
                {user.is_staff && (
                  <li><Link to="/dashboard" className={LINK_CLASS}>Dashboard</Link></li>
                )}
                <li>
                  <button onClick={logout} className={LINK_CLASS}>Logout</button>
                </li>
              </>
            ) : (
              <li><Link to="/login" className={LINK_CLASS}>Login</Link></li>
            )}
          </ul>
        </div>

        {/* Opening Hours */}
        <div>
          <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-4">Opening Hours</p>
          <div className="space-y-1.5">
            {hours.map(([day, time]) => (
              <div key={day} className="flex gap-3 text-sm">
                <span className="text-[var(--text-light-secondary)] w-8 shrink-0">{day}</span>
                <span className="text-[var(--text-light-secondary)]">{time}</span>
              </div>
            ))}
          </div>
          {siteSettings.special_hours_note && (
            <p className="mt-3 text-xs text-[var(--text-light-secondary)] border-t border-stone-800 pt-3">
              {siteSettings.special_hours_note}
            </p>
          )}
        </div>

      </div>

      <div className="border-t border-stone-800">
        <div className="container mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[var(--text-light-secondary)] text-xs">&copy; {new Date().getFullYear()} Allbikes. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p className="text-[var(--text-light-secondary)] text-xs">
              ABN: {siteSettings.abn_number}&nbsp;&nbsp;MD: {siteSettings.md_number}&nbsp;&nbsp;MRB: {siteSettings.mrb_number}
            </p>
            <div className="flex items-center gap-1.5 border-l border-stone-800 pl-4">
              <span className="text-[var(--text-light-secondary)] text-xs">Payments by</span>
              <img src={stripeLogo} alt="Stripe" className="h-5 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



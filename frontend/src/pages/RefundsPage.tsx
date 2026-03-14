import { Link } from 'react-router-dom';
import Hero from '@/components/Hero';
import Seo from '@/components/Seo';
import { Mail, Phone } from 'lucide-react';
import { siteSettings } from '@/config/siteSettings';
import SegwayImage from '@/assets/segway_1.webp';

const RefundsPage = () => {
  const primaryPhone = siteSettings.phone_number || siteSettings.mobile_number;
  const displayPhone = siteSettings.phone_number && siteSettings.mobile_number
    ? `${siteSettings.phone_number} / ${siteSettings.mobile_number}`
    : primaryPhone;

  return (
    <>
      <Seo
        title="Returns & Refunds | Scooter Shop"
        description="Our returns and refund policy for e-scooter purchases. Find out how to request a return or refund."
        canonicalPath="/refunds"
      />

      <Hero
        title="Returns & Refunds"
        description="We want you to be happy with your purchase. Here is everything you need to know about our returns and refunds process."
        imageUrl={SegwayImage}
      />

      <div className="container mx-auto px-4 py-10 max-w-3xl">

        {/* Overview + How to request */}
        <section className="mb-8">
          <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-3">Our Policy</h2>
              <p className="text-[var(--text-dark-secondary)] text-sm leading-relaxed mb-3">
                All e-scooter purchases are covered by our returns and refunds policy, which is set out in full in our{' '}
                <Link to="/terms" className="text-[var(--highlight)] hover:underline font-semibold">
                  Terms and Conditions
                </Link>
                . We recommend reading these before making a purchase.
              </p>
            </div>

            <div className="border-t border-stone-100 pt-6">
              <h2 className="text-lg font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-3">How to Request a Return or Refund</h2>
              <ol className="list-decimal list-inside space-y-2 text-[var(--text-dark-secondary)] text-sm">
                <li>Locate your order reference number — it starts with <span className="font-mono font-semibold text-[var(--text-light-primary)]">SS-</span> and was included in your confirmation email.</li>
                <li>Email or call us using the contact details below.</li>
                <li>Include your order reference, a description of the issue, and photos if the item is damaged or faulty.</li>
                <li>Our team will respond within as soon as possible with next steps.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-3">Contact Us</h2>
            {siteSettings.email_address && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[var(--highlight)] shrink-0" />
                <div>
                  <p className="text-xs text-[var(--text-dark-secondary)] uppercase tracking-widest font-bold mb-0.5">Email</p>
                  <a
                    href={`mailto:${siteSettings.email_address}`}
                    className="text-sm font-semiboldtext-[var(--text-dark-secondary)] hover:text-[var(--highlight)] transition-colors"
                  >
                    {siteSettings.email_address}
                  </a>
                </div>
              </div>
            )}
            {primaryPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[var(--highlight)] shrink-0" />
                <div>
                  <p className="text-xs text-[var(--text-dark-secondary)] uppercase tracking-widest font-bold mb-0.5">Phone</p>
                  <a
                    href={`tel:${primaryPhone}`}
                    className="text-sm font-semiboldtext-[var(--text-dark-secondary)] hover:text-[var(--highlight)] transition-colors"
                  >
                    {displayPhone}
                  </a>
                </div>
              </div>
            )}
            <p className="text-xs text-[var(--text-dark-secondary)] pt-2 border-t border-stone-100">
              Prefer to visit in person?{' '}
              <Link to="/contact" className="text-[var(--highlight)] hover:underline font-semibold">
                See our location and opening hours
              </Link>
              .
            </p>
          </div>
        </section>

      </div>
    </>
  );
};

export default RefundsPage;

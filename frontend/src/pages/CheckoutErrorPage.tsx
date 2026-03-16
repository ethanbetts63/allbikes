import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Seo from '@/components/Seo';
import { siteSettings } from '@/config/siteSettings';

const CheckoutErrorPage = () => {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');

  return (
    <>
      <Seo title="Payment Confirmation Issue | Scooter Shop" noindex={true} />
      <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
        <div className="container mx-auto px-4 py-12 max-w-2xl">

          <div className="text-center mb-10">
            <AlertCircle className="h-16 w-16 text-[var(--highlight)] mx-auto mb-4" />
            <h1 className="text-3xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
              Payment Not Confirmed
            </h1>
            <p className="text-[var(--text-dark-secondary)] text-sm">
              Your payment is taking longer than expected to confirm.
            </p>
          </div>

          {ref && (
            <div className="bg-[var(--bg-light-secondary)] border border-border-light rounded-lg p-5 mb-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-1">
                Your Reference
              </p>
              <p className="text-2xl font-black text-[var(--text-dark-primary)] font-mono tracking-wider">{ref}</p>
              <p className="text-xs text-[var(--text-dark-secondary)] mt-1">Keep this for your records</p>
            </div>
          )}

          <div className="bg-[var(--bg-light-primary)] border border-border-light rounded-lg p-6 mb-8 space-y-3 text-sm text-[var(--text-dark-secondary)]">
            <p>
              This doesn't necessarily mean your payment failed — it may still be processing. Please{' '}
              <strong className="text-[var(--text-dark-primary)]">check your email</strong> for a confirmation message before trying again.
            </p>
            <p>
              If you haven't received an email within a few minutes, please contact us and quote your reference number above and we'll sort it out.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/contact"
              className="flex-1 text-center py-3 px-6 rounded-lg font-bold uppercase tracking-widest text-sm bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] transition-colors"
            >
              Contact Us
            </Link>
            <a
              href={`mailto:${siteSettings.email_address}`}
              className="flex-1 text-center py-3 px-6 rounded-lg font-bold uppercase tracking-widest text-sm border border-border-light text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] transition-colors"
            >
              {siteSettings.email_address}
            </a>
          </div>

        </div>
      </div>
    </>
  );
};

export default CheckoutErrorPage;

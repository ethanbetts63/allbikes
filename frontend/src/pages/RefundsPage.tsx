import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';

const RefundsPage = () => {
  return (
    <>
      <Seo
        title="Returns & Refunds | Scooter Shop"
        description="Information about our returns and refund policy for e-scooter purchases."
      />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">Returns & Refunds</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-[var(--text-primary)]">
          <p>
            We want you to be satisfied with your purchase. Please review our full refund and returns policy
            in our{' '}
            <Link to="/terms" className="underline hover:text-primary">
              Terms and Conditions
            </Link>
            .
          </p>

          <h2 className="text-xl font-semibold">How to Request a Refund</h2>
          <p>
            To request a return or refund, please email us at the address below with your order reference
            number, the reason for your request, and any supporting photos if applicable.
          </p>

          <div className="bg-muted rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Refund requests:</p>
            <a
              href="mailto:info@scootershop.com.au"
              className="text-lg font-semibold text-primary hover:underline"
            >
              info@scootershop.com.au
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            Please include your order reference number (format: SS-YYYYMMDD-XXXX) in the subject line
            so we can locate your order quickly.
          </p>
        </div>
      </div>
    </>
  );
};

export default RefundsPage;

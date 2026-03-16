import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { getOrderByReference } from '@/api';
import type { Order } from '@/types/Order';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!ref) {
      setError('No order reference found.');
      setIsLoading(false);
      return;
    }
    const fetchOrder = async () => {
      try {
        const data = await getOrderByReference(ref);
        setOrder(data);
      } catch {
        setError('Order not found.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [ref]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error || !order) {
    return <p className="text-destructive text-center mt-8">{error || 'Order not found.'}</p>;
  }

  const isDeposit = order.payment_type === 'deposit';

  return (
    <>
      <Seo title={isDeposit ? 'Deposit Confirmed | Scooter Shop' : 'Order Confirmed | Scooter Shop'} noindex={true} />
      <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
        <div className="container mx-auto px-4 py-12 max-w-2xl">

          {/* Header */}
          <div className="text-center mb-10">
            <CheckCircle className="h-16 w-16 text-highlight1 mx-auto mb-4" />
            <h1 className="text-3xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
              {isDeposit ? 'Deposit Confirmed' : 'Order Confirmed'}
            </h1>
            <p className="text-[var(--text-dark-secondary)] text-sm">
              A confirmation email will be sent to {order.customer_email}.
            </p>
          </div>

          {/* Reference */}
          <div className="bg-[var(--bg-light-secondary)] border border-border-light rounded-lg p-5 mb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-1">
              {isDeposit ? 'Deposit Reference' : 'Order Reference'}
            </p>
            <p className="text-2xl font-black text-[var(--text-dark-primary)] font-mono tracking-wider">{order.order_reference}</p>
            <p className="text-xs text-[var(--text-dark-secondary)] mt-1">Keep this for your records</p>
          </div>

          {/* Details */}
          <div className="bg-[var(--bg-light-primary)] border border-border-light rounded-lg divide-y divide-stone-100 mb-8">

            {isDeposit ? (
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Motorcycle Reserved</p>
                <p className="font-bold text-[var(--text-dark-primary)]">{order.motorcycle_name}</p>
                <p className="text-[var(--text-dark-secondary)] text-sm">
                  ${parseFloat(order.amount_paid ?? '0').toLocaleString()} deposit paid — our team will be in touch shortly.
                </p>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Product</p>
                <p className="font-bold text-[var(--text-dark-primary)]">{order.product_name}</p>
                <p className="text-[var(--text-dark-secondary)] text-sm">
                  ${parseFloat(order.amount_paid ?? '0').toLocaleString()} incl. GST &middot; Free delivery Australia-wide
                </p>
              </div>
            )}

            {!isDeposit && (
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Delivery Address</p>
                <p className="text-stone-700 text-sm">{order.customer_name}</p>
                <p className="text-stone-700 text-sm">{order.address_line1}</p>
                {order.address_line2 && <p className="text-stone-700 text-sm">{order.address_line2}</p>}
                <p className="text-stone-700 text-sm">{order.suburb} {order.state} {order.postcode}</p>
              </div>
            )}

            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Contact</p>
              <p className="text-stone-700 text-sm">{order.customer_email}</p>
              {order.customer_phone && <p className="text-stone-700 text-sm">{order.customer_phone}</p>}
            </div>
          </div>

          <Link
            to={isDeposit ? '/inventory/motorcycles/new' : '/escooters'}
            className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
          >
            {isDeposit ? '← Back to New Motorcycles' : '← Back to E-Scooters'}
          </Link>

        </div>
      </div>
    </>
  );
};

export default CheckoutSuccessPage;

import { Truck, ShieldCheck, CreditCard, Zap, Wrench } from 'lucide-react';

const usps = [
  {
    icon: Truck,
    title: 'Free Delivery',
    description: 'Australia-wide, no minimum order. Your scooter comes to your door.',
    iconColor: 'text-[var(--highlight)]',
  },
  {
    icon: ShieldCheck,
    title: 'Price Includes GST',
    description: 'No surprise taxes at checkout. The price you see is the price you pay.',
    iconColor: 'text-[var(--highlight1)]',
  },
  {
    icon: CreditCard,
    title: 'Secure Checkout',
    description: 'Payments processed by Stripe — the same platform used by millions of businesses worldwide.',
    iconColor: 'text-[var(--highlight)]',
  },
  {
    icon: Zap,
    title: '12 Month Warranty',
    description: 'Every e-scooter comes with a manufacturer warranty for your peace of mind.',
    iconColor: 'text-[var(--highlight1)]',
  },
  {
    icon: Wrench,
    title: 'Workshop Backing',
    description: "We're a real workshop in Perth — not just an online store. We service what we sell.",
    iconColor: 'text-[var(--highlight)]',
  },
];

const EScooterUSPs = () => {
  return (
    <section className="bg-[var(--bg-light-primary)] py-12 px-6 border-b border-[var(--border-light)]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {usps.map(({ icon: Icon, title, description, iconColor }) => (
            <div key={title} className="flex flex-col items-start gap-3">
              <div className="bg-[var(--bg-light-secondary)] p-3 rounded-lg">
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-wide leading-tight mb-1">
                  {title}
                </p>
                <p className="text-[var(--text-dark-secondary)] text-xs leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EScooterUSPs;

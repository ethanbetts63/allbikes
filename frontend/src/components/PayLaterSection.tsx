import afterpayLogo from '@/assets/afterpay_logo.svg';
import klarnaLogo from '@/assets/klarna_logo.svg';
import zipLogo from '@/assets/zip_logo.svg';

const providers = [
  {
    name: 'Afterpay',
    logo: afterpayLogo,
    logoClass: 'h-9',
    tagline: 'Pay in 4 & Monthly Instalments',
    detail: 'Interest-free fortnightly instalments or longer-term monthly payment plans.',
  },
  {
    name: 'Klarna',
    logo: klarnaLogo,
    logoClass: 'h-[80px]',
    tagline: 'Flexible payment options',
    detail: 'Multiple ways to pay in instalments — available in Australia and New Zealand.',
  },
  {
    name: 'Zip',
    logo: zipLogo,
    logoClass: 'h-9',
    tagline: 'Zip Pay — always interest-free',
    detail: 'A flexible line of credit so you can buy now and pay at your own pace.',
  },
];

const PayLaterSection = () => {
  return (
    <section className="bg-foreground py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — typographic block */}
          <div>
            <p className="text-[var(--highlight)] text-xs font-bold uppercase tracking-[0.2em] mb-6">
              Flexible Payments
            </p>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-[var(--text-light-primary)] leading-none mb-6 uppercase italic">
              Shop Now.<br />Pay Later.
            </h2>
            <p className="text-[var(--text-light-secondary)] text-lg leading-relaxed max-w-sm">
              We partner with Australia's leading buy now, pay later providers so you can ride away today and spread the cost over time.
            </p>
          </div>

          {/* Right — provider list */}
          <div className="bg-[var(--bg-light-primary)] rounded-2xl p-8 flex flex-col divide-y divide-[var(--border-light)]">
            {providers.map(({ name, logo, logoClass, tagline, detail }) => (
              <div key={name} className="flex items-center gap-6 py-6 first:pt-0 last:pb-0">
                <div className="flex items-center justify-center shrink-0 w-32">
                  <img src={logo} alt={name} className={`${logoClass} w-auto`} loading="lazy" />
                </div>
                <div>
                  <p className="text-[var(--text-dark-primary)] font-semibold text-sm leading-tight mb-1">{tagline}</p>
                  <p className="text-[var(--text-dark-secondary)] text-xs leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default PayLaterSection;

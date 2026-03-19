import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const reasons = [
  "Established Perth dealership — over 30 years on the tools",
  "We service what we sell — electric scooter servicing available in-store",
  "Personally tested and hand-picked models we stand behind",
  "Secure online checkout powered by Stripe",
  "Order confirmation sent to your inbox immediately",
  "Free shipping anywhere in Australia — no surprises",
];

const EScooterWhyBuySection = () => {
  return (
    <section id="why-buy" className="bg-[var(--bg-dark-primary)] py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — bold typographic block */}
          <div>
            <p className="text-[var(--highlight)] text-xs font-bold uppercase tracking-[0.2em] mb-6">
              Allbikes &amp; Scooters · Dianella, Perth
            </p>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-[var(--text-light-primary)] leading-none mb-6 uppercase italic">
              Buy With<br />Confidence.
            </h2>
            <p className="text-[var(--text-light-secondary)] text-lg leading-relaxed max-w-sm mb-10">
              We're not a faceless warehouse. We're a real workshop in Perth that has been looking after riders for decades — online sales are an extension of that same service.
            </p>
            <Link to="/escooters">
              <Button
                size="lg"
                className="bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] font-bold px-8 text-base group"
              >
                Browse All E-Scooters
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Right — reasons checklist */}
          <div className="lg:border-l lg:border-stone-700 lg:pl-16">
            <p className="text-[var(--text-light-secondary)] text-xs font-bold uppercase tracking-widest mb-8">
              Why choose us
            </p>
            <ul className="space-y-5">
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-4">
                  <CheckCircle2 className="h-5 w-5 text-[var(--highlight)] mt-0.5 shrink-0" />
                  <span className="text-[var(--text-light-secondary)] text-lg leading-snug">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
};

export default EScooterWhyBuySection;

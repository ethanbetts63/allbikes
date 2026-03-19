import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck } from 'lucide-react';
import segwayImage from '@/assets/segway_1.webp';
import segwayImage320 from '@/assets/segway_1-320w.webp';
import segwayImage640 from '@/assets/segway_1-640w.webp';
import segwayImage768 from '@/assets/segway_1-768w.webp';
import segwayImage1024 from '@/assets/segway_1-1024w.webp';
import segwayImage1280 from '@/assets/segway_1-1280w.webp';

const segwaySrcSet = `${segwayImage320} 320w, ${segwayImage640} 640w, ${segwayImage768} 768w, ${segwayImage1024} 1024w, ${segwayImage1280} 1280w`;

const EScooterHero = () => {
  return (
    <div className="w-full flex flex-col lg:flex-row min-h-[520px]">

      {/* Text panel */}
      <div className="order-1 lg:order-1 lg:w-[45%] bg-[var(--bg-dark-primary)] flex flex-col justify-center px-8 py-12 md:px-14 md:py-16">
        <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
          Scooter Shop · Australia-Wide
        </p>
        <h1 className="text-[var(--text-light-primary)] text-4xl sm:text-5xl xl:text-6xl font-black uppercase italic leading-[0.9] mb-5">
          Buy Electric<br />
          Scooters<br />
          Online
        </h1>
        <p className="text-[var(--text-light-secondary)] text-base leading-relaxed mb-8 max-w-sm">
          Browse our range of electric scooters and buy directly online. Free delivery anywhere in Australia — all prices include GST.
        </p>

        {/* Inline trust chips */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex items-center gap-2 bg-[var(--bg-dark-secondary)] px-4 py-2">
            <Truck className="h-4 w-4 text-[var(--highlight)] shrink-0" />
            <span className="text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest">Free Delivery AU-Wide</span>
          </div>
          <div className="flex items-center gap-2 bg-[var(--bg-dark-secondary)] px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-[var(--highlight1)] shrink-0" />
            <span className="text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest">12 Month Warranty</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/escooters"
            className="inline-flex items-center justify-center gap-2 bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-wide px-7 py-3.5 transition-colors duration-200"
          >
            Shop E-Scooters
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#why-buy"
            className="inline-flex items-center justify-center gap-2 border border-stone-600 hover:border-stone-400 text-[var(--text-light-secondary)] hover:text-[var(--text-light-primary)] font-bold text-sm uppercase tracking-wide px-7 py-3.5 transition-colors duration-200"
          >
            Why Buy From Us
          </a>
        </div>
      </div>

      {/* Image panel */}
      <div className="order-2 lg:order-2 lg:flex-1 relative overflow-hidden min-h-[320px] lg:min-h-0 bg-[var(--bg-dark-secondary)]">
        <img
          src={segwayImage}
          srcSet={segwaySrcSet}
          sizes="(max-width: 1024px) 100vw, 55vw"
          alt="Electric scooter — buy online with free delivery Australia-wide"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-dark-primary)] via-transparent to-transparent lg:block hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Overlay label */}
        <div className="absolute bottom-0 left-0 p-7">
          <p className="text-[var(--highlight)] text-[9px] font-bold uppercase tracking-[0.25em] mb-1">
            Featured
          </p>
          <p className="text-[var(--text-light-primary)] text-xl font-black uppercase italic leading-none">
            Segway Electric Mopeds
          </p>
        </div>
      </div>

    </div>
  );
};

export default EScooterHero;

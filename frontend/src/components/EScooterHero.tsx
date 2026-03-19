import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck } from 'lucide-react';

const YOUTUBE_VIDEO_ID = 'cQJm8NcpzMU';

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

      {/* Video panel */}
      <div className="order-2 lg:order-2 lg:flex-1 bg-black flex items-center justify-center min-h-[280px] lg:min-h-0">
        <div className="w-full aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
            title="Electric Scooters — Scooter Shop"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>

    </div>
  );
};

export default EScooterHero;

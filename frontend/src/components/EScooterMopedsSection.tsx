import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

import segwayImage from '@/assets/segway_1.webp';
import segwayImage320 from '@/assets/segway_1-320w.webp';
import segwayImage640 from '@/assets/segway_1-640w.webp';
import segwayImage768 from '@/assets/segway_1-768w.webp';
import segwayImage1024 from '@/assets/segway_1-1024w.webp';
import segwayImage1280 from '@/assets/segway_1-1280w.webp';

const segwaySrcSet = `${segwayImage320} 320w, ${segwayImage640} 640w, ${segwayImage768} 768w, ${segwayImage1024} 1024w, ${segwayImage1280} 1280w`;

const EScooterMopedsSection = () => {
  return (
    <section className="w-full">
      <div className="flex flex-col md:flex-row-reverse min-h-[420px]">

        {/* Image */}
        <div className="w-full md:w-1/2 overflow-hidden">
          <img
            src={segwayImage}
            srcSet={segwaySrcSet}
            sizes="(max-width: 768px) 100vw, 50vw"
            alt="Segway electric moped"
            className="w-full h-64 md:h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Text */}
        <div className="w-full md:w-1/2 bg-[var(--bg-dark-primary)] p-10 flex flex-col justify-center gap-3">
          <p className="text-[var(--highlight)] text-sm font-bold uppercase tracking-widest">
            Innovation Meets Reliability
          </p>
          <h2 className="text-3xl font-black text-[var(--text-light-primary)] leading-tight">
            Segway Electric Mopeds
          </h2>
          <p className="text-[var(--text-light-secondary)] text-base leading-relaxed">
            Best known for their self-balancing transporters, Segway has evolved into a serious player in
            the electric moped space. As the market changes, Segway stands out with the experience and
            quality that comes from being an early innovator.
          </p>
          <p className="text-[var(--text-light-secondary)] text-base leading-relaxed">
            We've tested a lot of brands, but Segway's electric mopeds impressed us with their build
            quality, design, and performance. We're confident these are vehicles we can stand behind —
            and that you'll love riding.
          </p>
          <Link to="/escooters" className="self-start mt-2">
            <Button className="bg-highlight text-[var(--text-dark-primary)] font-bold px-6 py-3 text-sm hover:bg-highlight/80 flex items-center gap-2">
              Shop Electric Mopeds
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default EScooterMopedsSection;

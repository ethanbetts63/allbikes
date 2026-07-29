import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

import segwayImage from '@/assets/segway_1.webp';

const EScooterMopedsSection = () => {
  return (
    <section className="w-full">
      <div className="flex flex-col md:flex-row-reverse min-h-[420px]">

        {/* Image */}
        <div className="relative h-64 w-full overflow-hidden md:h-auto md:w-1/2">
          <NextImage
            src={segwayImage}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            alt="Segway electric moped"
            className="object-cover"
          />
        </div>

        {/* Text */}
        <div className="w-full md:w-1/2 bg-foreground p-10 flex flex-col justify-center gap-3">
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
            We&apos;ve tested a lot of brands, but Segway&apos;s electric mopeds impressed us with their build
            quality, design, and performance. We&apos;re confident these are vehicles we can stand behind -
            and that you&apos;ll love riding.
          </p>
          <Link href="/inventory/scooters/new" className="self-start mt-2">
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

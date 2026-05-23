import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Import images
import symImage from '../assets/sym_22.webp';
import segwayImage from '../assets/segway_1.webp';

import type { BrandProps } from '@/types/BrandProps';

const BrandCard = ({ image, alt, title, subtitle, description, imageLeft }: BrandProps) => {
  return (
    <div className={`flex flex-col ${imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} min-h-[420px]`}>
      <div className="relative w-full md:w-1/2 overflow-hidden h-64 md:h-auto">
        <NextImage
          src={image}
          sizes="(max-width: 768px) 100vw, 50vw"
          alt={alt}
          fill
          className="object-cover"
        />
      </div>
      <div className="w-full md:w-1/2 bg-[var(--bg-dark-primary)] p-10 flex flex-col justify-center gap-3">
        <p className="text-[var(--highlight)] text-sm font-bold uppercase tracking-widest">{subtitle}</p>
        <h3 className="text-3xl font-black text-[var(--text-light-primary)] leading-tight">{title}</h3>
        <p className="text-[var(--text-light-secondary)] text-base leading-relaxed">{description}</p>
        <Link href="/inventory/scooters/new" className="self-start mt-2">
          <Button className="bg-highlight text-[var(--text-dark-primary)] font-bold px-6 py-3 text-sm hover:bg-highlight/80 flex items-center gap-2">
            <span>See New Scooters</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

const BrandsSection = () => {
  const symText = `Founded in 1954, SYM is a trusted Taiwanese manufacturer known for exceptional build quality and reliability. They strike the perfect balance—offering better quality than many low-end brands, without the high price tag of premium models.
We've proudly partnered with them for years—mainly because it just makes sense. Their scooters come back with fewer issues, and our mechanics enjoy working on them.`;

  const segwayText = `Best known for their self-balancing transporters, Segway has evolved into a serious player in the electric moped space. As the market changes, Segway stands out with the experience and quality that comes from being an early innovator.
We've tested a lot of brands, but Segway's electric mopeds impressed us with their build quality, design, and performance. We're confident these are vehicles we can stand behind—and that you'll love riding.`;

  return (
    <section className="w-full">
      <BrandCard
        image={symImage}
        alt="SYM scooter for sale at ScooterShop, Dianella Perth"
        title="SYM Scooters"
        subtitle="Reliable, Affordable, and Built to Last"
        description={symText}
        imageLeft={true}
      />
      <BrandCard
        image={segwayImage}
        alt="Segway electric moped for sale at ScooterShop Perth"
        title="Segway Electric Mopeds"
        subtitle="Innovation Meets Reliability"
        description={segwayText}
        imageLeft={false}
      />
    </section>
  );
};

export default BrandsSection;

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Import images
import symImage from '../assets/sym_22.webp';
import segwayImage from '../assets/segway_1.webp';

// Import responsive images for SYM
import symImage320 from '../assets/sym_22-320w.webp';
import symImage640 from '../assets/sym_22-640w.webp';
import symImage768 from '../assets/sym_22-768w.webp';
import symImage1024 from '../assets/sym_22-1024w.webp';
import symImage1280 from '../assets/sym_22-1280w.webp';

// Import responsive images for Segway
import segwayImage320 from '../assets/segway_1-320w.webp';
import segwayImage640 from '../assets/segway_1-640w.webp';
import segwayImage768 from '../assets/segway_1-768w.webp';
import segwayImage1024 from '../assets/segway_1-1024w.webp';
import segwayImage1280 from '../assets/segway_1-1280w.webp';

import type { BrandProps } from '@/types/BrandProps';

const BrandCard = ({ image, imageSrcSet, alt, title, subtitle, description, imageLeft }: BrandProps) => {
  return (
    <div className={`flex flex-col ${imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} min-h-[420px]`}>
      <div className="w-full md:w-1/2 overflow-hidden">
        <img
          src={image}
          srcSet={imageSrcSet}
          sizes="(max-width: 768px) 100vw, 50vw"
          alt={alt}
          className="w-full h-64 md:h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="w-full md:w-1/2 bg-stone-900 p-10 flex flex-col justify-center gap-3">
        <p className="text-amber-400 text-sm font-bold uppercase tracking-widest">{subtitle}</p>
        <h3 className="text-3xl font-black text-white leading-tight">{title}</h3>
        <p className="text-stone-300 text-base leading-relaxed">{description}</p>
        <Link to="/inventory/motorcycles/new" className="self-start mt-2">
          <Button className="bg-amber-400 text-stone-900 font-bold px-6 py-3 text-sm hover:bg-amber-300 flex items-center gap-2">
            <span className="hidden md:inline">See New Motorcycles and Scooters</span>
            <span className="md:hidden">See New Bikes</span>
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

  const symSrcSet = `${symImage320} 320w, ${symImage640} 640w, ${symImage768} 768w, ${symImage1024} 1024w, ${symImage1280} 1280w`;
  const segwaySrcSet = `${segwayImage320} 320w, ${segwayImage640} 640w, ${segwayImage768} 768w, ${segwayImage1024} 1024w, ${segwayImage1280} 1280w`;

  return (
    <section className="w-full">
      <BrandCard
        image={symImage}
        imageSrcSet={symSrcSet}
        alt="SYM Scooter"
        title="SYM Scooters"
        subtitle="Reliable, Affordable, and Built to Last"
        description={symText}
        imageLeft={true}
      />
      <BrandCard
        image={segwayImage}
        imageSrcSet={segwaySrcSet}
        alt="Segway Electric Moped"
        title="Segway Electric Mopeds"
        subtitle="Innovation Meets Reliability"
        description={segwayText}
        imageLeft={false}
      />
    </section>
  );
};

export default BrandsSection;

import React from 'react';
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

interface BrandProps {
  image: string;
  imageSrcSet?: string;
  alt: string;
  title: string;
  subtitle: string;
  description: string;
  imageLeft?: boolean; 
}

const BrandCard: React.FC<BrandProps> = ({ image, imageSrcSet, alt, title, subtitle, description, imageLeft }) => {
  return (
    <div className={`flex flex-col md:flex-row ${imageLeft ? '' : 'md:flex-row-reverse'} items-center bg-background rounded-none lg:rounded-lg overflow-hidden`}>
      <div className="w-full md:w-1/2">
        <img 
            src={image} 
            srcSet={imageSrcSet} 
            sizes="(max-width: 768px) 100vw, 50vw"
            alt={alt} 
            className="w-full h-full object-cover rounded-none lg:rounded-lg" 
        />
      </div>
      <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
        <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-xl italic text-[var(--text-primary)] mb-4">{subtitle}</p>
        <p className="text-lg text-[var(--text-primary)] leading-relaxed mb-6">{description}</p>
        <Link to="/inventory/motorcycles/new" className="self-start">
          <Button className="bg-primary text-[var(--text-primary)] font-bold px-8 py-5 text-xl hover:bg-primary/90 flex items-center gap-2">
            <span className="hidden md:inline">See New Motorcycles and Scooters</span>
            <span className="md:hidden">See New Bikes</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

const BrandsSection: React.FC = () => {
  const symText = `
Founded in 1954, SYM is a trusted Taiwanese manufacturer known for exceptional build quality and reliability. They strike the perfect balance—offering better quality than many low-end brands, without the high price tag of premium models. 
We've proudly partnered with them for years—mainly because it just makes sense. Their scooters come back with fewer issues, and our mechanics enjoy working on them.`;

  const segwayText = `
Best known for their self-balancing transporters, Segway has evolved into a serious player in the electric moped space. As the market changes, Segway stands out with the experience and quality that comes from being an early innovator.
We've tested a lot of brands, but Segway's electric mopeds impressed us with their build quality, design, and performance. We're confident these are vehicles we can stand behind—and that you'll love riding.`;

  const symSrcSet = `${symImage320} 320w, ${symImage640} 640w, ${symImage768} 768w, ${symImage1024} 1024w, ${symImage1280} 1280w`;
  const segwaySrcSet = `${segwayImage320} 320w, ${segwayImage640} 640w, ${segwayImage768} 768w, ${segwayImage1024} 1024w, ${segwayImage1280} 1280w`;

  return (
    <section className="w-full py-6">
      <div className="container mx-auto md:px-4">
        <h2 className="text-4xl font-bold text-center text-[var(--text-primary)] mb-2">Our Featured Brands</h2>
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
          imageLeft={false} // Image on right for desktop
        />
      </div>
    </section>
  );
};

export default BrandsSection;
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Import images
import symImage from '../assets/sym_22.webp';
import segwayImage from '../assets/segway_1.webp'; // Assuming this image exists

interface BrandProps {
  image: string;
  alt: string;
  title: string;
  description: string;
  imageLeft?: boolean; // For desktop layout
}

const BrandCard: React.FC<BrandProps> = ({ image, alt, title, description, imageLeft }) => {
  return (
    <div className={`flex flex-col md:flex-row ${imageLeft ? '' : 'md:flex-row-reverse'} items-center bg-background rounded-lg shadow-lg overflow-hidden my-4`}>
      <div className="w-full md:w-1/2">
        <img src={image} alt={alt} className="w-full h-full object-cover" />
      </div>
      <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
        <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-4">{title}</h3>
        <p className="text-lg text-[var(--text-primary)] leading-relaxed mb-6">{description}</p>
        <Link to="/bikes/new" className="self-start">
          <Button className="bg-primary text-[var(--text-primary)] font-bold px-8 py-5 text-xl hover:bg-primary/90 flex items-center gap-2">
            See New Bikes <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

const BrandsSection: React.FC = () => {
  const symText = `SYM Scooters
Reliable, Affordable, and Built to Last

Founded in 1954, SYM is a trusted Taiwanese manufacturer known for exceptional build quality and reliability. They strike the perfect balance—offering better quality than many low-end brands, without the high price tag of premium models.

We've proudly partnered with them for years—mainly because it just makes sense. Their scooters come back with fewer issues, and our mechanics enjoy working on them.`;

  const segwayText = `Segway Electric Mopeds
Innovation Meets Reliability

Best known for their self-balancing transporters, Segway has evolved into a serious player in the electric moped space. As the market changes, Segway stands out with the experience and quality that comes from being an early innovator.

We've tested a lot of brands, but Segway's electric mopeds impressed us with their build quality, design, and performance. We're confident these are vehicles we can stand behind—and that you'll love riding.`;

  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-[var(--text-primary)] mb-10">Our Featured Brands</h2>
        <BrandCard
          image={symImage}
          alt="SYM Scooter"
          title="SYM Scooters"
          description={symText}
          imageLeft={true}
        />
        <BrandCard
          image={segwayImage}
          alt="Segway Electric Moped"
          title="Segway Electric Mopeds"
          description={segwayText}
          imageLeft={false} // Image on right for desktop
        />
      </div>
    </section>
  );
};

export default BrandsSection;

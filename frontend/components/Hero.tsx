import NextImage from 'next/image';
import type React from 'react';
import type { StaticImageData } from 'next/image';

export interface HeroProps {
  title: React.ReactNode;
  description: string;
  image: StaticImageData;
  centered?: boolean;
}

const Hero = ({ title, description, image, centered }: HeroProps) => {
  return (
    <section className="w-full">
      <div className="relative w-full h-48 md:h-64 overflow-hidden">
        <NextImage
          src={image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className={`absolute inset-0 hidden md:flex p-10 pb-8 ${centered ? 'items-center justify-center' : 'items-end justify-start'}`}>
          <div className={`bg-[var(--bg-dark-primary)]/70 backdrop-blur-sm rounded-lg px-6 py-4 max-w-xl ${centered ? 'text-center' : ''}`}>
            <h1 className="text-3xl font-black text-[var(--text-light-primary)] leading-tight">{title}</h1>
            <p className="text-[var(--text-light-secondary)] text-sm mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
      <div className="bg-[var(--bg-dark-primary)] px-6 py-4 md:hidden">
        <h1 className="text-2xl font-black text-[var(--text-light-primary)] leading-tight">{title}</h1>
        <p className="text-[var(--text-light-secondary)] text-sm mt-1 leading-relaxed">{description}</p>
      </div>
    </section>
  );
};

export default Hero;

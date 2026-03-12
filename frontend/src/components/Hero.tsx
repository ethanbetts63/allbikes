import type { HeroProps } from '@/types/HeroProps';

const Hero = ({ title, description, imageUrl }: HeroProps) => {
  return (
    <section className="relative w-full h-52 md:h-64 overflow-hidden">
      {/* Full-bleed image, no dim */}
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
      />
      {/* Text panel — semitransparent, left-anchored on desktop, centered on mobile */}
      <div className="absolute inset-0 flex items-center md:items-end md:justify-start justify-center p-6 md:p-10 md:pb-8">
        <div className="bg-stone-900/70 backdrop-blur-sm rounded-lg px-6 py-4 max-w-xl">
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{title}</h1>
          <p className="text-stone-300 text-sm mt-1 leading-relaxed hidden md:block">{description}</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;

import type { HeroProps } from '@/types/HeroProps';

const Hero = ({ title, description, imageUrl }: HeroProps) => {
  return (
    <section className="w-full">
      {/* Mobile: image on top, text below */}
      <div className="md:hidden">
        <div className="w-full h-48 overflow-hidden">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" fetchPriority="high" />
        </div>
        <div className="bg-[var(--bg-dark-primary)] px-6 py-4">
          <h1 className="text-2xl font-black text-[var(--text-light-primary)] leading-tight">{title}</h1>
          <p className="text-[var(--text-light-secondary)] text-sm mt-1 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Desktop: image with overlay text panel */}
      <div className="hidden md:block relative w-full h-64 overflow-hidden">
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 flex items-end justify-start p-10 pb-8">
          <div className="bg-[var(--bg-dark-primary)]/70 backdrop-blur-sm rounded-lg px-6 py-4 max-w-xl">
            <h1 className="text-3xl font-black text-[var(--text-light-primary)] leading-tight">{title}</h1>
            <p className="text-[var(--text-light-secondary)] text-sm mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

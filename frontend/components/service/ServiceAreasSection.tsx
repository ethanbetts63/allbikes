import { MapPin } from 'lucide-react';

const suburbs = [
  'Dianella', 'Morley', 'Yokine', 'Inglewood', 'Tuart Hill', 'Nollamara',
  'Mount Lawley', 'North Perth', 'Menora', 'Mount Hawthorn', 'Leederville',
  'Northbridge', 'Perth CBD', 'Osborne Park', 'Stirling', 'Scarborough',
  'Mirrabooka', 'Balga', 'Westminster', 'Subiaco', 'Fremantle', 'Cottesloe',
];

const defaultHeadingLines = ['Serving', 'Perth', 'Riders.'];

interface ServiceAreasSectionProps {
  headingLines?: string[];
  prose1?: string;
  prose2?: string;
}

const ServiceAreasSection = ({
  headingLines = defaultHeadingLines,
  prose1 = "Our workshop is based in Dianella, making us easily accessible from the northern suburbs and inner city. We regularly service motorcycles and scooters from Morley, Yokine, Inglewood, Mount Lawley, North Perth, Northbridge, and the Perth CBD.",
  prose2 = "Riders also come to us from further afield — Scarborough, Osborne Park, Subiaco, Fremantle, and Cottesloe. If you're searching for a motorcycle mechanic or scooter mechanic near you, chances are we're not far away.",
}: ServiceAreasSectionProps) => {
  return (
    <section className="bg-[var(--bg-dark-primary)] py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left — title + suburb chips */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-4 w-4 text-[var(--highlight)] shrink-0" />
              <p className="text-[var(--highlight)] text-xs font-bold uppercase tracking-[0.2em]">
                ScooterShop · Dianella, Perth
              </p>
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-[var(--text-light-primary)] leading-none mb-8 uppercase italic">
              {headingLines.map((line, i) => (
                <span key={i}>{line}{i < headingLines.length - 1 && <br />}</span>
              ))}
            </h2>
            <p className="text-[var(--text-light-secondary)] text-xs font-bold uppercase tracking-widest mb-5">
              Areas we cover
            </p>
            <div className="flex flex-wrap gap-2">
              {suburbs.map((suburb) => (
                <span
                  key={suburb}
                  className="bg-[var(--bg-dark-secondary)] text-[var(--text-light-secondary)] text-xs font-semibold uppercase tracking-widest px-3 py-1.5"
                >
                  {suburb}
                </span>
              ))}
            </div>
          </div>

          {/* Right — prose */}
          <div className="lg:border-l lg:border-stone-700 lg:pl-16">
            <div className="space-y-4 text-[var(--text-light-secondary)] text-lg leading-relaxed">
              <p>{prose1}</p>
              <p>{prose2}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ServiceAreasSection;

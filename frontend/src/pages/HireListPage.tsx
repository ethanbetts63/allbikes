import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Gauge, Wrench, Cog } from 'lucide-react';
import { FaqSection } from '@/components/FaqSection';
import HireConfidenceSection from '@/components/HireConfidenceSection';
import HireAreasSection from '@/components/HireAreasSection';
import PayLaterSection from '@/components/PayLaterSection';
import { getHireBikes, getPublicHireSettings } from '@/api';
import type { Bike } from '@/types/Bike';
import { formatRate } from '@/lib/hire';

const hireFaqData = [
  {
    question: 'Do I need a motorcycle licence to hire a bike?',
    answer: 'No. You only need a motorcycle licence to ride bikes larger than 50cc. We have a range of scooters and small bikes that can be hired with a car licence. Please check the specific requirements for each bike on our hire page.',
  },
  {
    question: 'How does the bond work?',
    answer: 'A refundable bond is charged at the time of payment along with your hire total. It is returned in full once the bike is back with us in good condition.',
  },
  {
    question: 'What is included in the hire?',
    answer: 'The hire fee covers the use of the motorcycle for your chosen period. The bike comes serviced and ready to ride. Fuel is not included — you return the bike with the same amount of fuel as when you collected it.',
  },
  {
    question: 'Can I extend my hire period?',
    answer: "Extensions are subject to availability. Contact us as early as possible if you need to extend and we'll do our best to accommodate you.",
  },
  {
    question: 'What happens if I damage the bike?',
    answer: 'Any damage beyond normal wear and tear will be assessed and deducted from your bond. Significant damage may incur additional costs. Our hire terms and conditions cover this in detail.',
  },
];

const HireListPage = () => {
  const navigate = useNavigate();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minStartDate, setMinStartDate] = useState('');
  const [maxStartDate, setMaxStartDate] = useState('');
  useEffect(() => {
    window.scrollTo(0, 0);
    getPublicHireSettings()
      .then((settings) => {
        const min = new Date();
        min.setDate(min.getDate() + settings.advance_min_days);
        setMinStartDate(min.toISOString().split('T')[0]);
        const max = new Date();
        max.setDate(max.getDate() + settings.advance_max_days);
        setMaxStartDate(max.toISOString().split('T')[0]);
      })
      .catch(() => setError('Failed to load hire settings.'));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetch = startDate && endDate
      ? getHireBikes(startDate, endDate)
      : getHireBikes();
    fetch
      .then((results) => {
        setBikes(results);
      })
      .catch(() => setError('Failed to load hire bikes.'))
      .finally(() => setIsLoading(false));
  }, [startDate, endDate]);

  const handleBook = (bike: Bike) => {
    navigate(`/hire/book?bike=${bike.id}&start=${startDate}&end=${endDate}`);
  };

  return (
    <>
      <Seo
        title="Motorcycle Hire Perth | Daily, Weekly & Monthly | ScooterShop"
        description="Hire a motorcycle in Perth from Allbikes & Scooters, Dianella. Flexible daily, weekly, and monthly rates. Book online — refundable bond, maintained fleet."
        canonicalPath="/hire"
      />

      {/* Hero with date picker */}
      <section className="bg-[var(--bg-dark-primary)] py-16 px-6">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-8">
          <div>
            <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
              Allbikes &amp; Scooters · Dianella, Perth
            </p>
            <h1 className="text-4xl sm:text-5xl font-black uppercase italic text-[var(--text-light-primary)] leading-none">
              Hire a Motorcycle
            </h1>
          </div>

          <div className="w-full bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <Label htmlFor="start_date" className="text-[var(--text-light-secondary)] text-xs uppercase tracking-widest">
                  Pick-up Date
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  min={minStartDate}
                  max={maxStartDate}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate('');
                  }}
                  className="bg-white/10 border-white/20 text-[var(--text-light-primary)] [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <Label htmlFor="end_date" className="text-[var(--text-light-secondary)] text-xs uppercase tracking-widest">
                  Return Date
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  min={startDate || minStartDate}
                  max={maxStartDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-[var(--text-light-primary)] [color-scheme:dark]"
                />
              </div>
            </div>
            {(!startDate || !endDate) && (
              <p className="text-[var(--text-light-secondary)] text-xs mt-3 text-center">
                Select dates to check availability
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="bg-[var(--card)]">
        <div className="container mx-auto px-4 lg:px-8 py-8">

          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Spinner className="h-12 w-12" />
            </div>
          )}

          {error && <p className="text-destructive text-center">{error}</p>}

          {!isLoading && !error && startDate && endDate && (
            <p className="text-sm text-[var(--text-dark-secondary)] mb-4">
              Showing bikes available from <strong>{startDate}</strong> to <strong>{endDate}</strong>
            </p>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bikes.length > 0 ? (
                bikes.map((bike) => {
                  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
                  const imageUrl = sortedImages[0]?.thumbnail || sortedImages[0]?.image || '/src/assets/motorcycle_images/placeholder.png';
                  const title = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

                  return (
                    <div key={bike.id} className="bg-[var(--card)] border border-[var(--border-light)] flex flex-col h-full">
                      <div className="relative aspect-[4/3] overflow-hidden shrink-0">
                        <img
                          src={imageUrl}
                          alt={title}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                        <span className="absolute bottom-2 left-2 bg-black/60 text-[var(--text-light-primary)] text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded capitalize">
                          {bike.condition}
                        </span>
                      </div>

                      <div className="px-4 py-4 flex flex-col gap-2.5 flex-1">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">{bike.make}</p>
                          <h3 className="text-base font-bold text-[var(--text-dark-primary)] leading-snug">
                            {bike.year && <span className="text-[var(--text-dark-secondary)] font-normal">{bike.year} </span>}
                            {bike.model}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-[var(--text-dark-secondary)]">
                          {bike.odometer > 0 && (
                            <span className="flex items-center gap-1">
                              <Gauge className="h-3.5 w-3.5" />
                              {bike.odometer.toLocaleString()} km
                            </span>
                          )}
                          {bike.engine_size && (
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3.5 w-3.5" />
                              {bike.engine_size}cc
                            </span>
                          )}
                          {bike.transmission && (
                            <span className="flex items-center gap-1">
                              <Cog className="h-3.5 w-3.5" />
                              {bike.transmission}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto pt-3 border-t border-[var(--border-light)] space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-dark-primary)] font-black text-xl">
                              {formatRate(bike)}
                            </span>
                            <Button
                              size="sm"
                              disabled={!startDate || !endDate}
                              onClick={() => handleBook(bike)}
                            >
                              Book Now
                            </Button>
                          </div>
                          {(!startDate || !endDate) && (
                            <p className="text-xs text-[var(--text-dark-secondary)]">Select dates above to book</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="col-span-3 py-16 text-center text-[var(--text-dark-secondary)]">
                  {startDate && endDate
                    ? 'No bikes are available for those dates. Try different dates.'
                    : 'No hire bikes are currently available. Check back soon.'}
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      <HireConfidenceSection />

      <PayLaterSection />

      <HireAreasSection />

      <FaqSection title="Hire FAQs" faqData={hireFaqData} />
    </>
  );
};

export default HireListPage;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import Hero from '@/components/Hero';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Gauge, Wrench, Cog } from 'lucide-react';
import { getHireBikes } from '@/api';
import type { Bike } from '@/types/Bike';
import HeroImage from '@/assets/sym_22.webp';

const formatRate = (bike: Bike): string => {
  if (bike.daily_rate && parseFloat(bike.daily_rate) > 0) {
    return `$${parseFloat(bike.daily_rate).toFixed(0)}/day`;
  }
  if (bike.weekly_rate && parseFloat(bike.weekly_rate) > 0) {
    return `$${parseFloat(bike.weekly_rate).toFixed(0)}/week`;
  }
  if (bike.monthly_rate && parseFloat(bike.monthly_rate) > 0) {
    return `$${parseFloat(bike.monthly_rate).toFixed(0)}/month`;
  }
  return 'Contact for rates';
};

const HireListPage = () => {
  const navigate = useNavigate();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    getHireBikes()
      .then(setBikes)
      .catch(() => setError('Failed to load hire bikes.'))
      .finally(() => setIsLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const handleBook = (bike: Bike) => {
    navigate(`/hire/${bike.slug}/book`, {
      state: { startDate, endDate },
    });
  };

  return (
    <>
      <Seo
        title="Hire a Motorcycle | Allbikes"
        description="Hire a motorcycle from Allbikes in Perth. Choose from our range of well-maintained used bikes available for daily, weekly, or monthly hire."
        canonicalPath="/hire"
      />
      <Hero
        title="Hire a Motorcycle"
        description="Choose from our range of well-maintained bikes available for daily, weekly, or monthly hire. Pick your dates and book online."
        imageUrl={HeroImage}
      />

      <div className="bg-[var(--card)]">
        <div className="container mx-auto px-4 lg:px-8 py-8">

          {/* Date filter bar */}
          <div className="bg-[var(--bg-light-primary)] border border-border-light rounded-lg p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <Label htmlFor="start_date">Pick-up Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate('');
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="end_date">Return Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button
                disabled={!startDate || !endDate}
                onClick={() => {/* availability filtering — Stage 2 */}}
                className="w-full"
              >
                Check Availability
              </Button>
            </div>
          </div>

          {/* Bike grid */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Spinner className="h-12 w-12" />
            </div>
          )}

          {error && <p className="text-destructive text-center">{error}</p>}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bikes.length > 0 ? (
                bikes.map((bike) => {
                  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
                  const imageUrl = sortedImages[0]?.thumbnail || sortedImages[0]?.image || '/src/assets/motorcycle_images/placeholder.png';
                  const title = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

                  return (
                    <div key={bike.id} className="bg-[var(--card)] border border-[var(--border-light)] flex flex-col h-full">
                      {/* Image */}
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

                      {/* Body */}
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

                        <div className="mt-auto pt-3 border-t border-[var(--border-light)] flex items-center justify-between gap-3">
                          <span className="text-[var(--text-dark-primary)] font-black text-xl">
                            {formatRate(bike)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleBook(bike)}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="col-span-3 py-16 text-center text-[var(--text-dark-secondary)]">
                  No hire bikes are currently available. Check back soon.
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default HireListPage;

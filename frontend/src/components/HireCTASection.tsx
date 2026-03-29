import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import useHireDateConstraints from '@/hooks/useHireDateConstraints';

const HireCTASection = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [blockedDateError, setBlockedDateError] = useState<string | null>(null);
  const { minStartDate, maxStartDate, isRangeBlocked } = useHireDateConstraints();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    navigate(`/hire?${params.toString()}`);
  };

  const bothSelected = startDate && endDate;
  const isBlocked = bothSelected ? isRangeBlocked(startDate, endDate) : false;

  return (
    <section className="bg-[var(--bg-dark-primary)] py-16 px-6">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-8">
        <div>
          <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
            Allbikes &amp; Scooters · Dianella, Perth
          </p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-[var(--text-light-primary)] leading-none">
            Hire a Motorcycle
          </h2>
          <p className="text-[var(--text-light-secondary)] text-sm mt-4">
            Daily, weekly &amp; monthly rates. Book online in minutes.
          </p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-lg p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5 text-left">
              <Label htmlFor="hire-cta-start" className="text-[var(--text-light-secondary)] text-xs uppercase tracking-widest">
                Pick-up Date
              </Label>
              <Input
                id="hire-cta-start"
                type="date"
                min={minStartDate}
                max={maxStartDate}
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (endDate && val > endDate) setEndDate('');
                  setBlockedDateError(endDate && val ? (isRangeBlocked(val, endDate) ? 'These dates include a period when the shop is closed.' : null) : null);
                }}
                className="bg-white/10 border-white/20 text-[var(--text-light-primary)] [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-left">
              <Label htmlFor="hire-cta-end" className="text-[var(--text-light-secondary)] text-xs uppercase tracking-widest">
                Return Date
              </Label>
              <Input
                id="hire-cta-end"
                type="date"
                min={startDate || minStartDate}
                max={maxStartDate}
                value={endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setEndDate(val);
                  setBlockedDateError(startDate && val ? (isRangeBlocked(startDate, val) ? 'These dates include a period when the shop is closed.' : null) : null);
                }}
                className="bg-white/10 border-white/20 text-[var(--text-light-primary)] [color-scheme:dark]"
              />
            </div>
          </div>
          {blockedDateError && (
            <p className="text-red-400 text-xs text-center mb-2">{blockedDateError}</p>
          )}
          <Button
            onClick={handleSearch}
            disabled={!bothSelected || isBlocked}
            className="w-full bg-[var(--highlight)] text-[var(--bg-dark-primary)] hover:bg-[var(--highlight)] hover:opacity-90"
          >
            {bothSelected ? 'Find Available Bikes' : 'Select dates to check availability'}
          </Button>
        </div>

        <Link
          to="/hire"
          className="text-[var(--text-light-secondary)] text-sm hover:text-[var(--text-light-primary)] underline underline-offset-2"
        >
          Browse all hire bikes →
        </Link>
      </div>
    </section>
  );
};

export default HireCTASection;

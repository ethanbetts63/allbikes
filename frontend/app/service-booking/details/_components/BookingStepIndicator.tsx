import Link from 'next/link';
import { Check } from 'lucide-react';

// Step 1 (Booking Details) lives on /service; this page handles steps 2–3.
const STEPS = ['Booking Details', 'Bike Details', 'Your Details'];

/** Progress across the three booking steps. Step 1 links back to /service to edit. */
export default function BookingStepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        const indicator = (
          <div
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${
              active ? 'text-[var(--text-dark-primary)]' : done ? 'text-highlight' : 'text-[var(--text-dark-secondary)]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                active
                  ? 'bg-[var(--text-dark-primary)] text-[var(--bg-light-primary)]'
                  : done
                    ? 'bg-highlight text-[var(--text-dark-primary)]'
                    : 'bg-[var(--border-light)] text-[var(--text-dark-secondary)]'
              }`}
            >
              {done ? <Check className="h-3 w-3" /> : n}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        );
        return (
          <div key={n} className="flex items-center gap-2">
            {n === 1 ? (
              <Link href="/service#book" title="Edit booking details" className="hover:opacity-80 transition-opacity">
                {indicator}
              </Link>
            ) : indicator}
            {i < STEPS.length - 1 && <span className="text-[var(--border-light)] text-xs">—</span>}
          </div>
        );
      })}
    </div>
  );
}

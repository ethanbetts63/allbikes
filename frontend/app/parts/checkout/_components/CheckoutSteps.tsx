import { Check } from 'lucide-react';

const STEPS = ['Your Details', 'Payment', 'Confirmation'];

export default function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${
                active ? 'text-black' : done ? 'text-black' : 'text-gray-400'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                  active ? 'bg-black text-white' : done ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="text-gray-300">—</span>}
          </div>
        );
      })}
    </div>
  );
}

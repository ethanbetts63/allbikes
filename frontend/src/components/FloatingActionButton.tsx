import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export const FloatingActionButton = () => {
  return (
    <Link
      to="/booking"
      className="fixed bottom-8 right-8 z-50
                 bg-emerald-800 text-[var(--text-light-primary)]
                 rounded-full shadow-md
                 px-5 py-3
                 flex items-center gap-2.5
                 text-sm font-bold uppercase tracking-widest
                 hover:bg-emerald-900 transition-colors duration-200"
    >
      <Wrench className="h-4 w-4 shrink-0" />
      Book Service
    </Link>
  );
};

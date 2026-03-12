import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export const FloatingActionButton = () => {
  return (
    <Link
      to="/booking"
      className="fixed bottom-8 right-8 z-50
                 bg-amber-400 text-stone-900
                 rounded-full shadow-lg shadow-amber-400/30
                 px-5 py-3
                 flex items-center gap-2.5
                 text-sm font-bold uppercase tracking-widest
                 hover:bg-amber-300 transition-colors duration-200"
    >
      <Wrench className="h-4 w-4 shrink-0" />
      Book Service
    </Link>
  );
};

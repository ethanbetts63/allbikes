import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export const FloatingActionButton = () => {
  return (
    <>
      <style>{`
        @keyframes fab-pulse {
          0%, 100% { box-shadow: 0 0 6px 1px rgba(74, 222, 128, 0.15); }
          50%       { box-shadow: 0 0 10px 3px rgba(74, 222, 128, 0.28); }
        }
        .fab-neon {
          animation: fab-pulse 3s ease-in-out infinite;
        }
        .fab-neon:hover {
          animation: none;
          box-shadow: 0 0 12px 4px rgba(74, 222, 128, 0.3);
        }
      `}</style>
      <Link
        to="/booking"
        className="fab-neon fixed bottom-8 right-8 z-50
                   bg-stone-900 border border-green-400/60
                   text-green-400
                   rounded-full
                   px-5 py-3
                   flex items-center gap-2.5
                   text-sm font-bold uppercase tracking-widest
                   transition-colors duration-200
                   hover:bg-stone-800 hover:text-green-300 hover:border-green-300"
      >
        <Wrench className="h-4 w-4 shrink-0" />
        Book Service
      </Link>
    </>
  );
};

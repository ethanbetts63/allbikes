import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const FloatingActionButton: React.FC = () => {
  return (
    <Link
      to="/booking"
      className="fixed bottom-8 right-8
                 bg-primary text-white
                 rounded-full shadow-lg
                 p-4
                 flex items-center justify-center
                 space-x-2
                 text-lg font-semibold
                 transition-all duration-300 ease-in-out
                 hover:bg-primary/90 hover:scale-105
                 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                 z-50" 
    >
      <span className="font-bold text-white">Book Service</span>
      <ArrowRight className="h-6 w-6" />
    </Link>
  );
};

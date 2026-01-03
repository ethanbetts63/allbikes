import React from 'react';
import { Link } from 'react-router-dom'; // Assuming react-router-dom for navigation

const HomeHero: React.FC = () => {
  return (
    <div className="w-full flex flex-col md:flex-row bg-gray-100 min-h-[500px]"> {/* Full width, responsive columns */}
      {/* Left Column */}
      <div className="md:w-1/2 flex flex-col">
        {/* Top Row: Used Bikes */}
        <Link to="/used-bikes" className="flex-1 flex items-center justify-center p-4 bg-blue-600 text-white text-3xl font-bold hover:bg-blue-700 transition-colors duration-300">
          Used Bikes
        </Link>
        {/* Bottom Row: New Bikes */}
        <Link to="/new-bikes" className="flex-1 flex items-center justify-center p-4 bg-green-600 text-white text-3xl font-bold hover:bg-green-700 transition-colors duration-300">
          New Bikes
        </Link>
      </div>

      {/* Right Column */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8 text-center bg-gray-200">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Perth Motorcycle/Scooter Mechanic & Dealership
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed max-w-prose">
          Operating in Perth for over 30 years, we are a motorcycle and scooter mechanic and dealership offering new and used sales across petrol and electric models. We provide motorcycle and scooter servicing, including tyre changes, maintenance, and general repairs. We haven’t served
        </p>
      </div>
    </div>
  );
};

export default HomeHero;

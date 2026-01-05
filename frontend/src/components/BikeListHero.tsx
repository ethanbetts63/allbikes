import React from 'react';

interface BikeListHeroProps {
  title: React.ReactNode;
  description: string;
  imageUrl: string;
}

const BikeListHero: React.FC<BikeListHeroProps> = ({ title, description, imageUrl }) => {
  return (
    <div
      className="relative w-full h-80 bg-cover bg-center"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <div className="absolute inset-0 bg-black opacity-60"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center">
        <h1 className="text-5xl font-extrabold">{title}</h1>
        <p className="text-xl max-w-3xl mt-4">{description}</p>
      </div>
    </div>
  );
};

export default BikeListHero;

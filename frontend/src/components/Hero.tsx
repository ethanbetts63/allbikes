import React from 'react';

interface HeroProps {
  title: React.ReactNode;
  description: string;
  imageUrl: string;
}

const Hero: React.FC<HeroProps> = ({ title, description, imageUrl }) => {
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

export default Hero;

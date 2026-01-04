import React from 'react';
import Seo from '@/components/Seo';
import ServiceBrands from '@/components/ServiceBrands';

const WorkshopPage: React.FC = () => {
  return (
    <div className="bg-white text-black">
      <Seo title="Workshop | Allbikes" />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4 text-center">Workshop Services</h1>
        <p className="text-center mb-8">
          Welcome to the Allbikes workshop page. Here you will find information about our services,
          booking options, and more.
        </p>
        
        <ServiceBrands />

        {/* Add more content here later */}
      </div>
    </div>
  );
};

export default WorkshopPage;
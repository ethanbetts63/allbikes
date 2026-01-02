import React from 'react';
import Seo from '@/components/Seo';

const WorkshopPage: React.FC = () => {
  return (
    <>
      <Seo title="Workshop | Allbikes" />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Workshop Services</h1>
        <p>
          Welcome to the Allbikes workshop page. Here you will find information about our services,
          booking options, and more.
        </p>
        {/* Add more content here later */}
      </div>
    </>
  );
};

export default WorkshopPage;
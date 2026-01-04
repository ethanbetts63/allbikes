import React from 'react';

interface BikeDetailsFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  nextStep: () => void;
  prevStep: () => void;
}

const BikeDetailsForm: React.FC<BikeDetailsFormProps> = ({ formData, setFormData, nextStep, prevStep }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Step 2: Bike Details</h2>
      <div className="space-y-4">
        {/* Placeholder for Bike Details */}
        <div>
          <label className="block text-sm font-medium">Registration Number</label>
          <input type="text" placeholder="e.g., 1AB-234" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Make</label>
          <input type="text" placeholder="e.g., Honda" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Model</label>
          <input type="text" placeholder="e.g., CBR500R" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Year</label>
          <input type="number" placeholder="e.g., 2022" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Odometer</label>
          <input type="number" placeholder="e.g., 15000" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        
        <div className="flex justify-between">
          <button onClick={prevStep} className="px-4 py-2 bg-gray-600 text-white rounded-md">
            Back
          </button>
          <button onClick={nextStep} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default BikeDetailsForm;

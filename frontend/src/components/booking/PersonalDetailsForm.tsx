import React from 'react';

interface PersonalDetailsFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  prevStep: () => void;
  handleSubmit: () => void; // This will be the final submission
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({ formData, setFormData, prevStep, handleSubmit }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Step 3: Personal Details</h2>
      <div className="space-y-4">
        {/* Placeholder for Personal Details */}
        <div>
          <label className="block text-sm font-medium">First Name</label>
          <input type="text" placeholder="John" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Last Name</label>
          <input type="text" placeholder="Doe" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" placeholder="john.doe@example.com" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input type="tel" placeholder="0412 345 678" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>

        <div className="flex justify-between">
          <button onClick={prevStep} className="px-4 py-2 bg-gray-600 text-white rounded-md">
            Back
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-md">
            Submit Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;

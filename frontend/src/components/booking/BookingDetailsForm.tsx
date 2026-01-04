import React from 'react';

// We'll need to pass form state and update functions as props
interface BookingDetailsFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  nextStep: () => void;
}

const BookingDetailsForm: React.FC<BookingDetailsFormProps> = ({ formData, setFormData, nextStep }) => {
  // In a real implementation, we would fetch job types and unavailable days here.
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Step 1: Booking Details</h2>
      <div className="space-y-4">
        {/* Placeholder for Date Picker */}
        <div>
          <label className="block text-sm font-medium">Drop-off Date & Time</label>
          <input type="text" placeholder="Date/Time picker will go here" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        
        {/* Placeholder for Service Selection */}
        <div>
          <label className="block text-sm font-medium">Services Required</label>
          <p className="text-sm text-gray-500">Service selection (from API) will go here.</p>
        </div>

        {/* Placeholder for Courtesy Vehicle */}
        <div>
          <label className="block text-sm font-medium">Courtesy Vehicle</label>
          <input type="checkbox" className="mt-1" />
          <span className="ml-2">Request a courtesy vehicle</span>
        </div>
        
        {/* Placeholder for Notes */}
        <div>
          <label className="block text-sm font-medium">Notes</label>
          <textarea placeholder="Add any notes for the mechanic" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>

        <button onClick={nextStep} className="px-4 py-2 bg-blue-600 text-white rounded-md">
          Next
        </button>
      </div>
    </div>
  );
};

export default BookingDetailsForm;

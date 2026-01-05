import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalDetailsFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  prevStep: () => void;
  handleSubmit: () => void; // This will be the final submission
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({ formData, setFormData, prevStep, handleSubmit }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Step 3: Personal Details</h2>
      <div className="space-y-4">
        
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input id="first_name" value={formData.first_name || ''} onChange={handleChange} placeholder="John" />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" value={formData.last_name || ''} onChange={handleChange} placeholder="Doe" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="john.doe@example.com" />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" value={formData.phone || ''} onChange={handleChange} placeholder="0412 345 678" />
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="destructive" className="text-white" onClick={prevStep}>
            Back
          </Button>
          <Button onClick={handleSubmit}>
            Submit Booking
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;

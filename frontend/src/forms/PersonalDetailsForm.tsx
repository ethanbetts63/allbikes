import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from 'react-router-dom';

interface PersonalDetailsFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  prevStep: () => void;
  handleSubmit: () => void;
  error: string | null;
}

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({ formData, setFormData, prevStep, handleSubmit, error }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev: any) => ({ ...prev, terms_accepted: checked }));
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <h2 className="text-2xl font-bold mb-6">Step 3: Personal Details</h2>
      <div className="space-y-4">
        
        <div>
          <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
          <Input id="first_name" value={formData.first_name || ''} onChange={handleChange} placeholder="John" />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
          <Input id="last_name" value={formData.last_name || ''} onChange={handleChange} placeholder="Doe" />
        </div>
        <div>
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="john.doe@example.com" />
        </div>
        <div>
          <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
          <Input id="phone" type="tel" value={formData.phone || ''} onChange={handleChange} placeholder="0412 345 678" />
        </div>

        <div className="flex items-center space-x-2 mt-4">
            <Checkbox
                id="terms_accepted"
                checked={formData.terms_accepted}
                onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="terms_accepted">
                I have read and accept the
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  Service Terms and Conditions.
                </Link>
            </Label>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="destructive" className="text-white" onClick={prevStep}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.terms_accepted}>
            Submit Booking
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;

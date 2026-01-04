import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BikeDetailsFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  nextStep: () => void;
  prevStep: () => void;
}

const BikeDetailsForm: React.FC<BikeDetailsFormProps> = ({ formData, setFormData, nextStep, prevStep }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Step 2: Bike Details</h2>
      <div className="space-y-4">
        
        <div>
          <Label htmlFor="registration_number">Registration Number</Label>
          <Input id="registration_number" value={formData.registration_number || ''} onChange={handleChange} placeholder="e.g., 1AB-234" />
        </div>
        <div>
          <Label htmlFor="make">Make</Label>
          <Input id="make" value={formData.make || ''} onChange={handleChange} placeholder="e.g., Honda" />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input id="model" value={formData.model || ''} onChange={handleChange} placeholder="e.g., CBR500R" />
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" value={formData.year || ''} onChange={handleChange} placeholder="e.g., 2022" />
        </div>
        <div>
          <Label htmlFor="odometer">Odometer (km)</Label>
          <Input id="odometer" type="number" value={formData.odometer || ''} onChange={handleChange} placeholder="e.g., 15000" />
        </div>
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={prevStep}>
            Back
          </Button>
          <Button onClick={nextStep}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BikeDetailsForm;

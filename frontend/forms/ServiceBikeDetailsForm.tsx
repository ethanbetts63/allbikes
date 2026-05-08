import { type ChangeEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BikeDetailsFormProps } from '@/types/BikeDetailsFormProps';

const BikeDetailsForm = ({ formData, setFormData, nextStep, prevStep }: BikeDetailsFormProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const canProceed = formData.registration_number && formData.make && formData.model;

  return (
    <div className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">Step 2 — Bike Details</p>

      <div className="space-y-1.5">
        <Label htmlFor="registration_number">Registration Number *</Label>
        <Input id="registration_number" value={formData.registration_number || ''} onChange={handleChange} placeholder="e.g., 1AB-234" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="make">Make *</Label>
        <Input id="make" value={formData.make || ''} onChange={handleChange} placeholder="e.g., Honda" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="model">Model *</Label>
        <Input id="model" value={formData.model || ''} onChange={handleChange} placeholder="e.g., CBR500R" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="year">Year *</Label>
        <Input id="year" type="number" value={formData.year || ''} onChange={handleChange} placeholder="e.g., 2022" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="odometer">Odometer (km) *</Label>
        <Input id="odometer" type="number" value={formData.odometer || ''} onChange={handleChange} placeholder="e.g., 15000" />
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={prevStep}
          className="py-3 px-8 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors border border-[var(--border-light)] text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] hover:border-[var(--text-dark-secondary)]"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={!canProceed}
          className="py-3 px-8 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BikeDetailsForm;

import { type ChangeEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from 'react-router-dom';
import type { PersonalDetailsFormProps } from '@/types/PersonalDetailsFormProps';

const PersonalDetailsForm = ({ formData, setFormData, prevStep, handleSubmit, isSubmitting, error }: PersonalDetailsFormProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev: any) => ({ ...prev, terms_accepted: checked }));
  };

  return (
    <div className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">Step 3 — Your Details</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="first_name">First Name *</Label>
        <Input id="first_name" value={formData.first_name || ''} onChange={handleChange} placeholder="John" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="last_name">Last Name *</Label>
        <Input id="last_name" value={formData.last_name || ''} onChange={handleChange} placeholder="Doe" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="john.doe@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone *</Label>
        <Input id="phone" type="tel" value={formData.phone || ''} onChange={handleChange} placeholder="0412 345 678" />
      </div>

      <div className="flex items-start gap-3 pt-1">
        <Checkbox
          id="terms_accepted"
          checked={formData.terms_accepted}
          onCheckedChange={handleCheckboxChange}
          className="mt-0.5"
        />
        <Label htmlFor="terms_accepted" className="text-sm leading-snug cursor-pointer">
          I have read and agree to the{' '}
          <Link to="/terms?type=service" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">
            Service Terms and Conditions
          </Link>
          .
        </Label>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={prevStep}
          className="py-3 px-8 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors border border-[var(--border-light)] text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] hover:border-[var(--text-dark-secondary)]"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.terms_accepted || isSubmitting}
          className="py-3 px-8 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</span>
          ) : (
            'Submit Request'
          )}
        </button>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;

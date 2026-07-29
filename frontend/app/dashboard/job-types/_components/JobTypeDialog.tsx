import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { JobType } from '@/types/JobType';

/** Create/edit dialog. `jobType` being null means create. */
export default function JobTypeDialog({ open, jobType, isSubmitting, onOpenChange, onSubmit }: {
  open: boolean;
  jobType: JobType | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; description: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-light-primary)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-dark-primary)]">
            {jobType ? 'Edit Job Type' : 'Add New Job Type'}
          </DialogTitle>
          <DialogDescription className="text-[var(--text-dark-primary)]">
            The &apos;Name&apos; must exactly match the job type name in MechanicDesk.
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so switching which job type is being edited remounts the form
            and re-seeds it. DialogContent unmounts when closed, so this is the
            only case the key has to cover — no reset effect needed. */}
        <JobTypeForm
          key={jobType?.id ?? 'new'}
          jobType={jobType}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function JobTypeForm({ jobType, isSubmitting, onSubmit }: {
  jobType: JobType | null;
  isSubmitting: boolean;
  onSubmit: (values: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(jobType?.name ?? '');
  const [description, setDescription] = useState(jobType?.description ?? '');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name) {
      setFormError('Name is required');
      return;
    }
    setFormError('');
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-[var(--text-dark-primary)] block mb-2">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        {formError && <p className="text-sm text-destructive mt-1">{formError}</p>}
      </div>
      <div>
        <Label htmlFor="description" className="text-[var(--text-dark-primary)] block mb-2">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="size-4" /> : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}

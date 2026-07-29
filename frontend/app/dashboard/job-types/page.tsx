'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';

import { getJobTypesAdmin, createJobType, updateJobType, deleteJobType } from '@/services/jobTypeService';
import type { JobType } from '@/types/JobType';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import JobTypeDialog from './_components/JobTypeDialog';
import JobTypesTable from './_components/JobTypesTable';

export default function JobTypesPage() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Bumped after any write to re-run the load.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getJobTypesAdmin()
      .then((data) => { if (!cancelled) setJobTypes(data); })
      .catch((error) => {
        if (cancelled) return;
        setNotification({ message: 'Failed to fetch job types.', type: 'error' });
        console.error(error);
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [reloadToken]);

  const openDialog = (jobType: JobType | null = null) => {
    setNotification(null);
    setEditingJobType(jobType);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: { name: string; description: string }) => {
    setNotification(null);
    setIsSubmitting(true);
    try {
      if (editingJobType) {
        await updateJobType(editingJobType.id, values);
        setNotification({ message: 'Job type updated successfully!', type: 'success' });
      } else {
        await createJobType(values as Omit<JobType, 'id'>);
        setNotification({ message: 'Job type created successfully!', type: 'success' });
      }
      setReloadToken((t) => t + 1);
      setIsDialogOpen(false);
    } catch (error) {
      setNotification({
        message: `Failed to ${editingJobType ? 'update' : 'create'} job type.`,
        type: 'error',
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setNotification(null);
    if (!window.confirm('Are you sure you want to delete this job type?')) return;
    try {
      await deleteJobType(id);
      setNotification({ message: 'Job type deleted successfully!', type: 'success' });
      setReloadToken((t) => t + 1);
    } catch (error) {
      setNotification({ message: 'Failed to delete job type.', type: 'error' });
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center ">
            <div>
              <CardTitle>Manage Job Types</CardTitle>
              <CardDescription>Add, edit, or delete job type descriptions for the booking form.</CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notification && (
            <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
              <AlertDescription>{notification.message}</AlertDescription>
              <Button variant="ghost" size="icon" onClick={() => setNotification(null)}>
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          )}
          <JobTypesTable jobTypes={jobTypes} onEdit={openDialog} onDelete={handleDelete} />
        </CardContent>

        <JobTypeDialog
          open={isDialogOpen}
          jobType={editingJobType}
          isSubmitting={isSubmitting}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}

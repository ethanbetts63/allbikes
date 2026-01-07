import React, { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';

import { getJobTypesAdmin, createJobType, updateJobType, deleteJobType } from '@/services/jobTypeService';
import type { JobType } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const JobTypesPage: React.FC = () => {
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [formError, setFormError] = useState('');


    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const fetchJobTypes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getJobTypesAdmin();
            setJobTypes(data);
        } catch (error) {
            setNotification({ message: 'Failed to fetch job types.', type: 'error' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobTypes();
    }, [fetchJobTypes]);

    const openDialog = (jobType: JobType | null = null) => {
        setNotification(null);
        setEditingJobType(jobType);
        if (jobType) {
            setName(jobType.name);
            setDescription(jobType.description);
        } else {
            setName('');
            setDescription('');
        }
        setFormError('');
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setNotification(null);
        if (!name) {
            setFormError('Name is required');
            return;
        }
        setFormError('');
        setIsSubmitting(true);

        const data = { name, description };

        try {
            if (editingJobType) {
                await updateJobType(editingJobType.id, data);
                setNotification({ message: 'Job type updated successfully!', type: 'success' });
            } else {
                await createJobType(data as Omit<JobType, 'id'>);
                setNotification({ message: 'Job type created successfully!', type: 'success' });
            }
            await fetchJobTypes();
            setIsDialogOpen(false);
        } catch (error) {
            setNotification({ message: `Failed to ${editingJobType ? 'update' : 'create'} job type.`, type: 'error' });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        setNotification(null);
        if (window.confirm('Are you sure you want to delete this job type?')) {
            try {
                await deleteJobType(id);
                setNotification({ message: 'Job type deleted successfully!', type: 'success' });
                await fetchJobTypes();
            } catch (error) {
                setNotification({ message: 'Failed to delete job type.', type: 'error' });
                console.error(error);
            }
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobTypes.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.name}</TableCell>
                                <TableCell>{job.description}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openDialog(job)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(job.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-black">{editingJobType ? 'Edit Job Type' : 'Add New Job Type'}</DialogTitle>
                        <DialogDescription className="text-black">
                            The 'Name' must exactly match the job type name in MechanicDesk.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name" className="text-black block mb-2">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            {formError && <p className="text-sm text-destructive mt-1">{formError}</p>}
                        </div>
                        <div>
                            <Label htmlFor="description" className="text-black block mb-2">Description</Label>
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
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default JobTypesPage;

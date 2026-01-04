import React, { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

import { getJobTypesAdmin, createJobType, updateJobType, deleteJobType } from '@/services/jobTypeService';
import type { JobType } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

const JobTypesPage: React.FC = () => {
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [formError, setFormError] = useState('');


    const fetchJobTypes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getJobTypesAdmin();
            setJobTypes(data);
        } catch (error) {
            toast.error('Failed to fetch job types.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobTypes();
    }, [fetchJobTypes]);

    const openDialog = (jobType: JobType | null = null) => {
        setEditingJobType(jobType);
        if (jobType) {
            setName(jobType.name);
            setDescription(jobType.description);
            setIsActive(jobType.is_active);
        } else {
            setName('');
            setDescription('');
            setIsActive(true);
        }
        setFormError('');
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name) {
            setFormError('Name is required');
            return;
        }
        setFormError('');
        setIsSubmitting(true);
        
        const data = { name, description, is_active: isActive };

        try {
            if (editingJobType) {
                await updateJobType(editingJobType.id, data);
                toast.success('Job type updated successfully!');
            } else {
                await createJobType(data);
                toast.success('Job type created successfully!');
            }
            await fetchJobTypes();
            setIsDialogOpen(false);
        } catch (error) {
            toast.error(`Failed to ${editingJobType ? 'update' : 'create'} job type.`);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this job type?')) {
            try {
                await deleteJobType(id);
                toast.success('Job type deleted successfully!');
                await fetchJobTypes();
            } catch (error) {
                toast.error('Failed to delete job type.');
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobTypes.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.name}</TableCell>
                                <TableCell>{job.description}</TableCell>
                                <TableCell>{job.is_active ? 'Yes' : 'No'}</TableCell>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingJobType ? 'Edit Job Type' : 'Add New Job Type'}</DialogTitle>
                        <DialogDescription>
                            The 'Name' must exactly match the job type name in MechanicDesk.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            {formError && <p className="text-sm text-destructive mt-1">{formError}</p>}
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="flex items-center space-x-2">
                             <Checkbox
                                id="is_active"
                                checked={isActive}
                                onCheckedChange={(checked) => setIsActive(checked as boolean)}
                            />
                            <Label htmlFor="is_active">Is Active</Label>
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
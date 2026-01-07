"use client"

import * as React from 'react';
import { useForm, Controller, type SubmitHandler, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Bike, ManagedImage, MotorcycleFormData } from '@/types/index';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface MotorcycleFormProps {
    initialData?: Bike;
    onSubmit: SubmitHandler<MotorcycleFormData>;
    isLoading?: boolean;
}

const MotorcycleForm: React.FC<MotorcycleFormProps> = ({ initialData, onSubmit, isLoading }) => {
    
    const { register, handleSubmit, control, formState: { errors } } = useForm<MotorcycleFormData>({
        defaultValues: {
            ...initialData,
            managedImages: initialData?.images
                .sort((a, b) => a.order - b.order)
                .map(img => ({
                    id: String(img.id),
                    source_id: img.id,
                    file: null,
                    previewUrl: img.image,
                    order: img.order,
                })) || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "managedImages"
    });

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach((file, index) => {
                const newImage: ManagedImage = {
                    id: self.crypto.randomUUID(),
                    source_id: null,
                    file: file,
                    previewUrl: URL.createObjectURL(file),
                    // Assign a temporary order, can be adjusted by user
                    order: fields.length + index + 1,
                };
                append(newImage);
            });
        }
    };
    
    // Cleanup blob URLs on unmount
    React.useEffect(() => {
        return () => {
            fields.forEach(field => {
                if (field.file) {
                    URL.revokeObjectURL(field.previewUrl);
                }
            });
        };
    }, [fields]);

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>{initialData ? 'Edit Motorcycle' : 'Add New Motorcycle'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label htmlFor="make">Make</Label><Input id="make" {...register('make', { required: 'Make is required' })} />{errors.make && <p className="text-red-500 text-sm">{errors.make.message}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="model">Model</Label><Input id="model" {...register('model', { required: 'Model is required' })} />{errors.model && <p className="text-red-500 text-sm">{errors.model.message}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="year">Year</Label><Input id="year" type="number" {...register('year', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="price">Price (AUD)</Label><Input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="discount_price">Discount Price (AUD)</Label><Input id="discount_price" type="number" step="0.01" {...register('discount_price', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="odometer">Odometer (km)</Label><Input id="odometer" type="number" {...register('odometer', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="stock_number">Stock Number</Label><Input id="stock_number" {...register('stock_number')} /></div>
                    </div>

                    {/* Status, Condition, and Featured Switch */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Controller name="status" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="for_sale">For Sale</SelectItem>
                                        <SelectItem value="sold">Sold</SelectItem>
                                        <SelectItem value="reserved">Reserved</SelectItem>
                                        <SelectItem value="unavailable">Unavailable</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </div>
                        <div className="space-y-2">
                            <Label>Condition</Label>
                            <Controller name="condition" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="used">Used</SelectItem>
                                        <SelectItem value="demo">Demo</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                             <Controller name="is_featured" control={control} render={({ field }) => (
                                <Switch id="is_featured" checked={field.value} onCheckedChange={field.onChange} />
                             )} />
                            <Label htmlFor="is_featured">Featured Motorcycle?</Label>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register('description')} />
                    </div>


                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="images">Add Images</Label>
                        {/* This input is now only for adding new images */}
                        <Input id="images" type="file" multiple onChange={handleFileSelect} />
                        
                        <div className="rounded-md border mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Order</TableHead>
                                        <TableHead>Preview</TableHead>
                                        <TableHead>File Name</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    {...register(`managedImages.${index}.order`, { valueAsNumber: true })}
                                                    className="w-20"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <img src={field.previewUrl} alt={`Preview ${index + 1}`} className="w-20 h-auto object-cover rounded-md" />
                                            </TableCell>
                                            <TableCell>
                                                {field.file?.name || field.previewUrl.split('/').pop()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {fields.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No images added.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Motorcycle'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};

export default MotorcycleForm;
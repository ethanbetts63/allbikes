// src/components/admin/inventory/MotorcycleForm.tsx
"use client"

import * as React from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch"
import type { Bike } from '@/types';

// This will be the shape of our form data
export type MotorcycleFormData = Omit<Bike, 'id' | 'images'> & {
    images: FileList | null;
};

interface MotorcycleFormProps {
    initialData?: Bike;
    onSubmit: SubmitHandler<MotorcycleFormData>;
    isLoading?: boolean;
}

const MotorcycleForm: React.FC<MotorcycleFormProps> = ({ initialData, onSubmit, isLoading }) => {
    // Separate initial images for preview from form data
    const [imagePreviews, setImagePreviews] = React.useState<string[]>(initialData?.images.map(img => img.image) || []);

    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<MotorcycleFormData>({
        // Handle defaultValues carefully to avoid type conflicts with the 'images' field
        defaultValues: initialData ? {
            ...initialData,
            images: null, // The form's 'images' field is for new uploads, so it starts as null
        } : {},
    });

    const watchImages = watch("images");

    React.useEffect(() => {
        if (watchImages && watchImages.length > 0) {
            const newPreviews = Array.from(watchImages).map(file => URL.createObjectURL(file));
            setImagePreviews(newPreviews);

            return () => {
                newPreviews.forEach(url => URL.revokeObjectURL(url));
            };
        }
    }, [watchImages]);

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
                        <Label htmlFor="images">Images</Label>
                        <Input id="images" type="file" multiple {...register('images')} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {imagePreviews.map((src, index) => (
                                <img key={index} src={src} alt={`Preview ${index + 1}`} className="w-full h-auto object-cover rounded-md" />
                            ))}
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
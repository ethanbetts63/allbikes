import { useEffect, type ChangeEvent } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import type { ManagedImage } from '@/types/ManagedImage';
import type { MotorcycleFormData } from '@/types/MotorcycleFormData';
import type { MotorcycleFormProps } from '@/types/MotorcycleFormProps';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const MotorcycleForm = ({ initialData, onSubmit, isLoading }: MotorcycleFormProps) => {
    
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

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
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
    useEffect(() => {
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
                        <div className="space-y-2"><Label htmlFor="make">Make</Label><Input id="make" {...register('make', { required: 'Make is required' })} />{errors.make && <p className="text-destructive text-sm">{errors.make.message}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="model">Model</Label><Input id="model" {...register('model', { required: 'Model is required' })} />{errors.model && <p className="text-destructive text-sm">{errors.model.message}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="year">Year</Label><Input id="year" type="number" {...register('year', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="price">Price (AUD)</Label><Input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="discount_price">Discount Price (AUD)</Label><Input id="discount_price" type="number" step="0.01" {...register('discount_price', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="odometer">Odometer (km)</Label><Input id="odometer" type="number" {...register('odometer', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="stock_number">Stock Number</Label><Input id="stock_number" {...register('stock_number', { setValueAs: (v) => v === '' ? null : v })} /></div>
                        <div className="space-y-2"><Label htmlFor="vin">VIN</Label><Input id="vin" {...register('vin', { setValueAs: (v) => v === '' ? null : v })} /></div>
                        <div className="space-y-2"><Label htmlFor="rego">Rego</Label><Input id="rego" {...register('rego', { setValueAs: (v) => v === '' ? null : v })} /></div>
                        <div className="space-y-2"><Label htmlFor="rego_exp">Rego Expiry</Label><Input id="rego_exp" type="date" {...register('rego_exp', { setValueAs: (v) => v === '' ? null : v })} /></div>
                        <div className="space-y-2"><Label htmlFor="engine_size">Engine Size (cc)</Label><Input id="engine_size" type="number" {...register('engine_size', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="warranty_months">Warranty (months)</Label><Input id="warranty_months" type="number" {...register('warranty_months', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="range">Range (km)</Label><Input id="range" type="number" {...register('range', { valueAsNumber: true })} /></div>
                        <div className="space-y-2"><Label htmlFor="seats">Seats</Label><Input id="seats" type="number" {...register('seats', { valueAsNumber: true })} /></div>
                    </div>

                    {/* Status, Condition, Transmission, and Boolean Switches */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Controller name="status" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="for_sale">For Sale</SelectItem>
                                        <SelectItem value="available_soon">Available Soon</SelectItem>
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
                        <div className="space-y-2">
                            <Label>Transmission</Label>
                            <Controller name="transmission" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select transmission" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="automatic">Automatic</SelectItem>
                                        <SelectItem value="manual">Manual</SelectItem>
                                        <SelectItem value="semi-auto">Semi-Automatic</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                             <Controller name="is_featured" control={control} render={({ field }) => (
                                <Switch id="is_featured" checked={field.value} onCheckedChange={field.onChange} />
                             )} />
                            <Label htmlFor="is_featured">Featured?</Label>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <Controller name="popular" control={control} render={({ field }) => (
                                <Switch id="popular" checked={!!field.value} onCheckedChange={field.onChange} />
                            )} />
                            <Label htmlFor="popular">Popular?</Label>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <Controller name="is_hire" control={control} render={({ field }) => (
                                <Switch id="is_hire" checked={!!field.value} onCheckedChange={field.onChange} />
                            )} />
                            <Label htmlFor="is_hire">For Hire?</Label>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register('description')} />
                    </div>

                    {/* YouTube Link */}
                    <div className="space-y-2">
                        <Label htmlFor="youtube_link">YouTube Video URL</Label>
                        <Input id="youtube_link" type="url" {...register('youtube_link')} placeholder="https://www.youtube.com/watch?v=..." />
                    </div>


                    {/* Hire rate — shown only when is_hire is on */}
                    <Controller name="is_hire" control={control} render={({ field: isHireField }) => (
                        isHireField.value ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="daily_rate">Daily Rate (AUD)</Label>
                                    <Input id="daily_rate" type="number" step="0.01" placeholder="e.g. 85.00" {...register('daily_rate', { setValueAs: (v) => v === '' ? null : v })} />
                                </div>
                                <p className="col-span-full text-sm text-[var(--text-dark-secondary)]">
                                    Weekly and monthly discounts are applied automatically via Hire Settings.
                                </p>
                            </div>
                        ) : <></>
                    )} />

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
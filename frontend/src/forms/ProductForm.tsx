"use client"

import { useEffect, type ChangeEvent } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ManagedImage } from '@/types/ManagedImage';
import type { ProductFormData } from '@/types/ProductFormData';
import type { Product } from '@/types/Product';

interface ProductFormProps {
    initialData?: Product;
    onSubmit: (data: ProductFormData) => Promise<void>;
    isLoading: boolean;
}

const ProductForm = ({ initialData, onSubmit, isLoading }: ProductFormProps) => {

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProductFormData>({
        defaultValues: {
            name: '',
            brand: '',
            description: '',
            price: '',
            discount_price: '',
            stock_quantity: 0,
            is_active: true,
            is_featured: false,
            youtube_link: '',
            managedImages: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'managedImages',
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                brand: initialData.brand || '',
                description: initialData.description || '',
                price: initialData.price,
                discount_price: initialData.discount_price || '',
                stock_quantity: initialData.stock_quantity,
                is_active: initialData.is_active,
                is_featured: initialData.is_featured,
                youtube_link: initialData.youtube_link || '',
                managedImages: (initialData.images || [])
                    .sort((a, b) => a.order - b.order)
                    .map(img => ({
                        id: String(img.id),
                        source_id: img.id,
                        file: null,
                        previewUrl: img.medium || img.image,
                        order: img.order,
                    })),
            });
        }
    }, [initialData, reset]);

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach((file, index) => {
                const newImage: ManagedImage = {
                    id: self.crypto.randomUUID(),
                    source_id: null,
                    file: file,
                    previewUrl: URL.createObjectURL(file),
                    order: fields.length + index + 1,
                };
                append(newImage);
            });
        }
    };

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
                    <CardTitle>{initialData ? 'Edit Product' : 'Add New Product'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input id="name" {...register('name', { required: 'Product name is required.' })} placeholder="e.g. Ninebot E25 E-Scooter" />
                            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Input id="brand" {...register('brand')} placeholder="e.g. Segway" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (AUD incl. GST) *</Label>
                            <Input id="price" type="number" step="0.01" min="0" {...register('price', { required: 'Price is required.' })} placeholder="999.00" />
                            {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount_price">Discount Price (AUD incl. GST)</Label>
                            <Input id="discount_price" type="number" step="0.01" min="0" {...register('discount_price')} placeholder="Optional" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                            <Input id="stock_quantity" type="number" min="0" {...register('stock_quantity', { required: 'Stock quantity is required.', valueAsNumber: true })} />
                            {errors.stock_quantity && <p className="text-destructive text-sm">{errors.stock_quantity.message}</p>}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="is_active"
                                control={control}
                                render={({ field }) => (
                                    <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                                )}
                            />
                            <Label htmlFor="is_active">Active (visible to public)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="is_featured"
                                control={control}
                                render={({ field }) => (
                                    <Switch id="is_featured" checked={field.value} onCheckedChange={field.onChange} />
                                )}
                            />
                            <Label htmlFor="is_featured">Featured (show on home page)</Label>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register('description')} rows={5} />
                    </div>

                    {/* YouTube Link */}
                    <div className="space-y-2">
                        <Label htmlFor="youtube_link">YouTube Video URL</Label>
                        <Input id="youtube_link" type="url" {...register('youtube_link')} placeholder="https://www.youtube.com/watch?v=..." />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="images">Add Images</Label>
                        <Input id="images" type="file" multiple accept="image/*" onChange={handleFileSelect} />

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
                        {isLoading ? 'Saving...' : 'Save Product'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};

export default ProductForm;

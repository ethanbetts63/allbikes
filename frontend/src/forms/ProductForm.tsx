import { useEffect, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import type { ProductFormData } from '@/types/ProductFormData';
import type { Product } from '@/types/Product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading: boolean;
}

const ProductForm = ({ initialData, onSubmit, isLoading }: ProductFormProps) => {
  const blobUrls = useRef<string[]>([]);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      brand: '',
      description: '',
      price: '',
      stock_quantity: 0,
      is_active: true,
      managedImages: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'managedImages',
  });

  useEffect(() => {
    if (initialData) {
      const existingImages = (initialData.images || [])
        .sort((a, b) => a.order - b.order)
        .map((img) => ({
          id: String(img.id),
          source_id: img.id,
          file: null,
          previewUrl: img.medium || img.image,
          order: img.order,
        }));
      reset({
        name: initialData.name,
        brand: initialData.brand || '',
        description: initialData.description || '',
        price: initialData.price,
        stock_quantity: initialData.stock_quantity,
        is_active: initialData.is_active,
        managedImages: existingImages,
      });
    }
  }, [initialData, reset]);

  useEffect(() => {
    return () => {
      blobUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const currentCount = fields.length;
    Array.from(files).forEach((file, i) => {
      const previewUrl = URL.createObjectURL(file);
      blobUrls.current.push(previewUrl);
      append({
        id: `new-${Date.now()}-${i}`,
        source_id: null,
        file,
        previewUrl,
        order: currentCount + i,
      });
    });
    e.target.value = '';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
        {initialData ? 'Edit Product' : 'Add Product'}
      </h2>

      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Product name is required.' })}
          placeholder="e.g. Ninebot E25 E-Scooter"
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      {/* Brand */}
      <div className="space-y-1">
        <Label htmlFor="brand">Brand</Label>
        <Input id="brand" {...register('brand')} placeholder="e.g. Segway" />
      </div>

      {/* Price */}
      <div className="space-y-1">
        <Label htmlFor="price">Price (AUD incl. GST) *</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          {...register('price', { required: 'Price is required.' })}
          placeholder="999.00"
        />
        {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
      </div>

      {/* Stock Quantity */}
      <div className="space-y-1">
        <Label htmlFor="stock_quantity">Stock Quantity *</Label>
        <Input
          id="stock_quantity"
          type="number"
          min="0"
          {...register('stock_quantity', {
            required: 'Stock quantity is required.',
            valueAsNumber: true,
          })}
        />
        {errors.stock_quantity && (
          <p className="text-sm text-red-500">{errors.stock_quantity.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} rows={5} placeholder="Product description..." />
      </div>

      {/* Is Active */}
      <div className="flex items-center gap-3">
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <Switch
              id="is_active"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="is_active">Active (visible to public)</Label>
      </div>

      {/* Images */}
      <div className="space-y-3">
        <Label>Images</Label>
        <Input type="file" accept="image/*" multiple onChange={handleImageUpload} />

        {fields.length > 0 && (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-2">Preview</th>
                  <th className="p-2">Order</th>
                  <th className="p-2">File</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-t">
                    <td className="p-2">
                      <img
                        src={field.previewUrl}
                        alt="preview"
                        className="h-12 w-12 object-cover rounded"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="w-16"
                        {...register(`managedImages.${index}.order`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="p-2 text-muted-foreground truncate max-w-[150px]">
                      {field.file ? field.file.name : 'Existing image'}
                    </td>
                    <td className="p-2 flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => index > 0 && move(index, index - 1)}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => index < fields.length - 1 && move(index, index + 1)}
                        disabled={index === fields.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  );
};

export default ProductForm;

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductForm from '@/forms/ProductForm';
import type { ProductFormData } from '@/types/ProductFormData';
import type { Product } from '@/types/Product';
import {
  getProductById,
  createProduct,
  updateProduct,
  uploadProductImage,
  manageProductImages,
} from '@/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Product | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const product = await getProductById(Number(id));
          setInitialData(product);
        } catch {
          setNotification({ message: 'Failed to load product data.', type: 'error' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    setNotification(null);

    try {
      const { managedImages, ...productData } = data;
      let saved: Product;

      if (id) {
        saved = await updateProduct(Number(id), productData);
        setNotification({ message: `"${saved.name}" updated.`, type: 'success' });
      } else {
        saved = await createProduct(productData);
        setNotification({ message: `"${saved.name}" created.`, type: 'success' });
      }

      const hasImages = managedImages && managedImages.length > 0;

      if (hasImages) {
        setNotification({ message: 'Processing images...', type: 'info' });
        await manageProductImages(saved.id, managedImages);

        const newImages = managedImages.filter((img) => img.file !== null);
        const uploadErrors: string[] = [];

        for (let i = 0; i < newImages.length; i++) {
          const img = newImages[i];
          setNotification({ message: `Uploading image ${i + 1} of ${newImages.length}...`, type: 'info' });
          try {
            await uploadProductImage(saved.id, img.file!, img.order);
          } catch {
            uploadErrors.push(img.file!.name);
          }
        }

        if (uploadErrors.length > 0) {
          setNotification({
            message: `Saved, but ${uploadErrors.length} image(s) failed: ${uploadErrors.join(', ')}`,
            type: 'error',
          });
          return;
        }
      } else if (id) {
        await manageProductImages(saved.id, []);
      }

      navigate('/dashboard/products');
    } catch (err: any) {
      let msg: string;
      if (err.data?.detail) {
        msg = err.data.detail;
      } else if (err.data && typeof err.data === 'object') {
        msg = Object.entries(err.data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
      } else {
        msg = err.message || 'An unknown error occurred.';
      }
      setNotification({ message: `Failed to save: ${msg}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (id && isLoading && !initialData) {
    return <p className="text-[var(--text-dark-secondary)]">Loading...</p>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-[var(--text-dark-primary)] mb-4">{id ? 'Edit Product' : 'Add Product'}</h1>
      {notification && (
        <Alert
          variant={notification.type === 'error' ? 'destructive' : 'default'}
          className="mb-4"
        >
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}
      <ProductForm initialData={initialData} onSubmit={handleFormSubmit} isLoading={isLoading} />
    </div>
  );
};

export default AdminProductDetailPage;

import type { Product } from './Product';
import type { ProductFormData } from './ProductFormData';

export interface ProductFormProps {
    initialData?: Product;
    onSubmit: (data: ProductFormData) => Promise<void>;
    isLoading: boolean;
}

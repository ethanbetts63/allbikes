import type { ManagedImage } from './ManagedImage';

export interface ProductFormData {
  name: string;
  brand: string;
  description: string;
  price: string;
  discount_price: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  managedImages: ManagedImage[];
}

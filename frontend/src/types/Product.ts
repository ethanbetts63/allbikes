import type { ProductImage } from './ProductImage';

export interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  images: ProductImage[];
  in_stock: boolean;
  low_stock: boolean;
  created_at: string;
  updated_at: string;
}

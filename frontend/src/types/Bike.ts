import type { BikeImage } from './BikeImage';

export type Bike = {
  id: number;
  slug: string;
  make: string;
  model: string;
  year: number;
  price: string;
  discount_price?: string;
  condition: 'new' | 'used' | 'demo';
  status: 'for_sale' | 'available_soon' | 'sold' | 'reserved' | 'unavailable';
  is_featured?: boolean;
  popular?: boolean;
  odometer: number;
  engine_size: number;
  range: number;
  seats: number;
  description: string;
  youtube_link: string;
  rego: string;
  rego_exp: string;
  stock_number: string;
  warranty_months: number;
  transmission: string;
  images: BikeImage[];
  date_posted: string;
};

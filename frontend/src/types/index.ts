// --- Auth Types ---
export interface AuthResponse {
  access: string;
  refresh: string;
}

// --- User Types ---
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}

// --- Inventory Types ---
export type BikeImage = {
  image: string;
};

export type Bike = {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  condition: 'new' | 'used' | 'demo';
  status: string;
  is_featured: boolean;
  odometer: number;
  engine_size: number;
  description: string;
  youtube_link: string;
  rego: string;
  rego_exp: string;
  stock_number: string;
  warranty_months: number;
  images: BikeImage[];
};
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
  id: number;
  image: string;
  order: number;
};

export type Bike = {
  id: number;
  make: string;
  model: string;
  year: number;
  price: string;
  condition: 'new' | 'used' | 'demo';
  status: string;
  is_featured?: boolean;
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
  
  // --- Site Settings Types ---
  export interface SiteSettings {
    id: number;
    enable_motorcycle_mover: boolean;
    enable_banner: boolean;
    banner_text: string;
    phone_number: string;
    email_address: string;
    street_address: string;
    address_locality: string;
    address_region: string;
    postal_code: string;
    google_places_place_id: string;
    mrb_number: string;
    abn_number: string;
    md_number: string;
    youtube_link: string;
    instagram_link: string;
    facebook_link: string;
    opening_hours_monday: string;
    opening_hours_tuesday: string;
    opening_hours_wednesday: string;
    opening_hours_thursday: string;
    opening_hours_friday: string;
    opening_hours_saturday: string;
    opening_hours_sunday: string;
    last_updated: string;
  }

  export interface FooterSettings {
    phone_number: string;
    email_address: string;
    street_address: string;
    address_locality: string;
    address_region: string;
    postal_code: string;
    abn_number: string;
    md_number: string;
    mrb_number: string;
    opening_hours_monday: string;
    opening_hours_tuesday: string;
    opening_hours_wednesday: string;
    opening_hours_thursday: string;
    opening_hours_friday: string;
    opening_hours_saturday: string;
    opening_hours_sunday: string;
}

  
// --- Generic API Types ---
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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
  thumbnail: string | null;
  medium: string;
  order: number;
};

export type Bike = {
  id: number;
  slug: string;
  make: string;
  model: string;
  year: number;
  price: string;
  discount_price?: string;
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
  transmission: string;
  images: BikeImage[];
  date_posted: string;
};

// Represents a unified image object for the form's state
export type ManagedImage = {
    id: string; // A unique ID for react-hook-form's useFieldArray (can be db id or new uuid)
    source_id: number | null; // The database ID if it's an existing image
    file: File | null; // The File object if it's a new upload
    previewUrl: string; // The URL for rendering the preview (remote URL or blob URL)
    order: number;
}

// This will be the shape of our form data
export type MotorcycleFormData = Omit<Bike, 'id' | 'images'> & {
    managedImages: ManagedImage[];
};
  
  // --- Site Settings Types ---
export interface Brand {
  id: number;
  name: string;
  serviceable: boolean;
}

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
// --- Service Settings Types ---
export interface ServiceSettings {
    id: number;
    booking_advance_notice: number;
    drop_off_start_time: string;
    drop_off_end_time: string;
}

// --- Job Type Types ---
export interface JobType {
    id: number;
    name: string;
    description: string;
}

export interface EnrichedJobType {
    name: string;
    description: string | null;
}

// --- Legal Types ---
export interface TermsAndConditions {
  version: string;
  content: string;
  published_at: string;
}
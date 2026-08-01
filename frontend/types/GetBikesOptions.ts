export interface GetBikesOptions {
  condition?: 'new' | 'used' | 'demo' | 'new,demo' | 'parts';
  vehicle_type?: 'motorcycle' | 'scooter' | 'motorcycle,scooter';
  page?: number;
  is_hire?: boolean;
  search?: string;
  make?: string;
  status?: 'for_sale' | 'available_soon' | 'sold' | 'reserved' | 'unavailable' | 'hide';
  include_hidden?: boolean;
  ordering?: string;
  page_size?: number;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  min_engine_size?: number;
  max_engine_size?: number;
}

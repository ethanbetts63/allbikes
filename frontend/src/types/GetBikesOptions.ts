export interface GetBikesOptions {
  condition?: 'new' | 'used' | 'demo' | 'new,demo';
  page?: number;
  is_featured?: boolean;
  ordering?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  min_engine_size?: number;
  max_engine_size?: number;
}

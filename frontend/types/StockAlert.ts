export interface StockAlertSubscriber {
  id: number;
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface StockAlertItem {
  id?: number;
  title: string;
  listing_url: string;
  deposit_url: string;
  image_url: string;
  price_label: string;
  details: string;
}

export interface StockAlertPreview {
  subject: string;
  recipient_count: number;
  items: StockAlertItem[];
  html: string;
  text: string;
}

export interface StockAlertIncludedBike {
  id: number;
  title: string;
  condition: string;
  vehicle_type: string;
  status: string;
  price_label: string;
  listing_url: string;
}

export interface StockAlertAdminData {
  subscribers: StockAlertSubscriber[];
  preview: StockAlertPreview;
  included_bikes: StockAlertIncludedBike[];
}

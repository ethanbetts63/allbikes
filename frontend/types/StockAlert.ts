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

export interface StockAlertCampaign {
  id: number;
  subject: string;
  status: 'sending' | 'sent' | 'partial' | 'failed';
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
  items: StockAlertItem[];
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
  listing_url: string;
}

export interface StockAlertAdminData {
  subscribers: StockAlertSubscriber[];
  campaigns: StockAlertCampaign[];
  preview: StockAlertPreview;
  included_bikes: StockAlertIncludedBike[];
}

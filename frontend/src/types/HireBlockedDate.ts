export interface HireBlockedDate {
  id: number;
  date_from: string;
  date_to: string;
  reason: string;
  motorcycle: number | null;
  motorcycle_name: string | null;
  created_at: string;
}

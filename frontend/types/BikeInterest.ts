export interface BikeInterestEnquiry {
  id: number;
  email: string;
  created_at: string;
  responded_at: string | null;
  responded: boolean;
  motorcycle_id: number;
  motorcycle_title: string;
  motorcycle_status: string;
  motorcycle_slug: string;
}

export interface BikeInterestReplyDraft {
  to: string;
  subject: string;
  body: string;
  enquiry: BikeInterestEnquiry;
}

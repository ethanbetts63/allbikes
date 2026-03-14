export interface BookingRequestLog {
  id: number;
  customer_name: string;
  customer_email: string;
  vehicle_registration: string | null;
  request_payload: Record<string, unknown>;
  response_status_code: number;
  response_body: Record<string, unknown>;
  status: 'Success' | 'Failed';
  created_at: string;
}

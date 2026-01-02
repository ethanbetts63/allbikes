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

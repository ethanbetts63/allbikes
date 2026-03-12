import type { UserProfile } from './UserProfile';
import type { AuthResponse } from './AuthResponse';

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  handleLoginSuccess: (authResponse: AuthResponse) => Promise<void>;
  logout: () => void;
}

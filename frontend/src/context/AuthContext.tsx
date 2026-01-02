import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import * as api from '@/api';
import type { AuthResponse, UserProfile } from '@/types';

// --- Type Definitions ---
interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  handleLoginSuccess: (authResponse: AuthResponse) => Promise<void>;
  logout: () => void;
}

// --- Context Creation ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const fullProfile = await api.getUserProfile();
      setUser(fullProfile);
    } catch (error) {
      console.error("Failed to fetch user profile, logging out.", error);
      logout(); // Clears tokens and user state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // On initial load, try to restore session by fetching the user profile
    setIsLoading(true);
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    const handleAuthFailure = () => {
      console.log("Authentication failure event received. Logging out.");
      logout();
    };

    window.addEventListener('auth-failure', handleAuthFailure);

    return () => {
      window.removeEventListener('auth-failure', handleAuthFailure);
    };
  }, []);

  /**
   * Central handler for successful authentication.
   * Sets tokens and then loads the full user profile.
   */
  const handleLoginSuccess = async (authResponse: AuthResponse) => {
    const { access, refresh } = authResponse;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    
    // After setting tokens, load the full user profile to populate the context
    setIsLoading(true);
    await loadUserProfile();
  };

  /**
   * Login handler for the traditional email/password form.
   * It calls the API and then uses handleLoginSuccess on the response.
   */
  const loginWithPassword = async (email: string, password: string) => {
    try {
      const authResponse = await api.loginUser(email, password);
      await handleLoginSuccess(authResponse);
    } catch (error) {
      // Clear any partial login data on failure and re-throw for the form to handle
      logout();
      throw error;
    }
  };

  /**
   * Clears user state and removes tokens from localStorage.
   */
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loginWithPassword,
    handleLoginSuccess,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

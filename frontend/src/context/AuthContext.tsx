import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import * as api from '@/api';
import type { UserProfile } from '@/types/UserProfile';
import type { AuthContextType } from '@/types/AuthContextType';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    try {
      const fullProfile = await api.getUserProfile();
      setUser(fullProfile);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    const handleAuthFailure = () => logout();
    window.addEventListener('auth-failure', handleAuthFailure);
    return () => window.removeEventListener('auth-failure', handleAuthFailure);
  }, []);

  const loginWithPassword = async (email: string, password: string) => {
    try {
      await api.loginUser(email, password);
      setIsLoading(true);
      await loadUserProfile();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logoutUser();
    } catch {
      // best-effort — clear client state regardless
    }
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loginWithPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthContextType } from '../types/auth';
import { apiClient } from '../api/client';

interface ExtendedAuthContextType extends AuthContextType {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginGuest: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<{ user: User }>('/api/dashboard');
      if (data && data.user) {
        // Normalize permissions to an array if needed
        let perms = data.user.permission;
        if (typeof perms === 'string') {
          try { perms = JSON.parse(perms); } catch { perms = []; }
        }
        setUser({ ...data.user, permission: Array.isArray(perms) ? perms : [] });
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClient<{ success: boolean; data?: User; error?: string }>('/api/log/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success && res.data) {
        setUser(res.data);
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const loginGuest = async () => {
    try {
      const res = await apiClient<{ success: boolean; data?: User; error?: string }>('/api/log/guest', {
        method: 'POST',
      });
      if (res.success && res.data) {
        let perms = res.data.permission;
        if (typeof perms === 'string') {
          try { perms = JSON.parse(perms); } catch { perms = []; }
        }
        setUser({ ...res.data, permission: Array.isArray(perms) ? perms : [] });
        return { success: true };
      }
      return { success: false, error: res.error || 'Guest access failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Guest access failed' };
    }
  };

  const logout = async () => {
    try {
      await apiClient('/api/log/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
    }
  };

  const updateCurrentUserLocal = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginGuest,
        logout,
        refreshUser,
        updateCurrentUserLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

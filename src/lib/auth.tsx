import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, setAuthToken, clearAuthSession, getAuthToken } from './api';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'officer' | 'viewer';
  avatar?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = 'inuka_auth_user';

const mapServerUser = (u: any): User => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName ?? u.full_name ?? '',
  phone: u.phone,
  role: u.role || 'admin',
  createdAt: u.createdAt ?? u.created_at ?? new Date().toISOString(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, validate any stored session against the backend.
  useEffect(() => {
    const validateSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const u = mapServerUser(data.user);
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        } else {
          clearAuthSession();
        }
      } catch {
        clearAuthSession();
      } finally {
        setIsLoading(false);
      }
    };
    validateSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed. Please try again.' };
      }
      setAuthToken(data.token);
      const u = mapServerUser(data.user);
      setUser(u);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server. Please try again.' };
    }
  };

  const signup = async (data: { email: string; password: string; fullName: string; phone?: string }) => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: resData.error || 'Registration failed.' };
      }
      setAuthToken(resData.token);
      const u = mapServerUser(resData.user);
      setUser(u);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server. Please try again.' };
    }
  };

  const logout = useCallback(() => {
    apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    clearAuthSession();
  }, []);

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const forgotPassword = async (_email: string) => {
    // Password reset is not available in this deployment; contact the administrator.
    return { success: false, error: 'Password reset is not available. Please contact your system administrator.' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

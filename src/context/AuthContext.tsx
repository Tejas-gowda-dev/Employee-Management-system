import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { User } from '../types.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}`);
      if (response.data?.success) {
        setUser(response.data.data);
        localStorage.setItem('ems_user_id', userId);
      } else {
        setUser(null);
        localStorage.removeItem('ems_user_id');
        localStorage.removeItem('ems_access_token');
        localStorage.removeItem('ems_refresh_token');
      }
    } catch {
      setUser(null);
      localStorage.removeItem('ems_user_id');
      localStorage.removeItem('ems_access_token');
      localStorage.removeItem('ems_refresh_token');
    }
  };

  const refreshUser = async () => {
    const savedUserId = localStorage.getItem('ems_user_id');
    if (savedUserId) {
      await fetchUserProfile(savedUserId);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUserId = localStorage.getItem('ems_user_id');
      if (savedUserId) {
        await fetchUserProfile(savedUserId);
      }
      setLoading(false);
    };

    initializeAuth();

    // Catch global session expired event from axios interceptor
    const handleExpired = () => {
      setUser(null);
      localStorage.removeItem('ems_user_id');
      localStorage.removeItem('ems_access_token');
      localStorage.removeItem('ems_refresh_token');
    };

    window.addEventListener('auth-session-expired', handleExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.success) {
        const loggedInUser = response.data.data.user;
        const accessToken = response.data.data.accessToken;
        const refreshToken = response.data.data.refreshToken;
        
        localStorage.setItem('ems_access_token', accessToken);
        localStorage.setItem('ems_refresh_token', refreshToken);
        localStorage.setItem('ems_user_id', loggedInUser.id);
        
        setUser(loggedInUser);
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('ems_user_id');
      localStorage.removeItem('ems_access_token');
      localStorage.removeItem('ems_refresh_token');
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return;
    try {
      const response = await api.put(`/users/${user.id}`, updatedData);
      if (response.data?.success) {
        setUser(response.data.data);
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, refreshUser }}>
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

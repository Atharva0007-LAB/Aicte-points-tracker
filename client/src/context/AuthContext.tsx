import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiLogin, apiLogout, apiGetMe, apiTriggerSeed, apiSignup, apiUpdateProfile, apiApplyClub } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  applyClub: (clubData: {
    name: string;
    description?: string;
    email: string;
    password: string;
    full_name: string;
  }) => Promise<void>;
  updateProfile: (profileData: {
    roll_number: string;
    department: string;
    division?: string;
    year?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  seed: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = async () => {
    try {
      setLoading(true);
      const res = await apiGetMe();
      setUser(res.user);
      setError(null);
    } catch (err: any) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiLogin(email, password);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiSignup(email, password, fullName);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const applyClub = async (clubData: {
    name: string;
    description?: string;
    email: string;
    password: string;
    full_name: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiApplyClub(clubData);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Club application failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: {
    roll_number: string;
    department: string;
    division?: string;
    year?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiUpdateProfile(profileData);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiLogout();
      setUser(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const seed = async () => {
    try {
      setLoading(true);
      await apiTriggerSeed();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Seeding failed');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, applyClub, updateProfile, logout, seed, clearError }}>
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

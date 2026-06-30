import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await api.get<User>('users/me');
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await api.post<{ access_token: string; refresh_token: string }>('auth/login', { email, password });
    await refreshUser();
  };

  const register = async (email: string, password: string, name: string) => {
    await api.post<{ access_token: string; refresh_token: string }>('auth/register', { email, password, name });
    await refreshUser();
  };

  const logout = async () => {
    try {
      await api.post('auth/logout');
    } catch (error) {
      // ignore
    }
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const userData = await api.get<User>('users/me');
      setUser(userData);
    } catch (error) {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

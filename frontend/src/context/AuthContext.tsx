import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  switchDemoUser: (role: 'CUSTOMER' | 'ORGANISER' | 'ADMIN') => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const switchDemoUser = async (role: 'CUSTOMER' | 'ORGANISER' | 'ADMIN') => {
    const emailMap = {
      CUSTOMER: 'customer@seatswift.com',
      ORGANISER: 'organiser@seatswift.com',
      ADMIN: 'admin@seatswift.com',
    };
    try {
      const res = await api.post('/auth/login', {
        email: emailMap[role],
        password: 'password123',
      });
      login(res.data.token, res.data.user);
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchDemoUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

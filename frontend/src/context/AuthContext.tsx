import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Role } from '../types';
import { apiRequest, setAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSales: boolean;
  isWarehouse: boolean;
  isAccounts: boolean;
  canManageCustomers: boolean;
  canManageProducts: boolean;
  canAdjustStock: boolean;
  canManageChallans: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ accessToken: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { accessToken, user: userData } = res.data;
      setToken(accessToken);
      setUser(userData);
      setAuthToken(accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      setAuthToken(null);
    }
  };

  const role: Role | undefined = user?.role;
  const isAdmin = role === 'ADMIN';
  const isSales = role === 'SALES';
  const isWarehouse = role === 'WAREHOUSE';
  const isAccounts = role === 'ACCOUNTS';

  const canManageCustomers = isAdmin || isSales;
  const canManageProducts = isAdmin || isWarehouse;
  const canAdjustStock = isAdmin || isWarehouse;
  const canManageChallans = isAdmin || isSales;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        isAdmin,
        isSales,
        isWarehouse,
        isAccounts,
        canManageCustomers,
        canManageProducts,
        canAdjustStock,
        canManageChallans,
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

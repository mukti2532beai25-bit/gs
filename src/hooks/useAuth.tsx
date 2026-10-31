import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthState } from '../types/bahiverse';
import { authApi, getToken, setToken, clearToken } from '../services/api';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, businessName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await authApi.me();
      setState({ user, token, isLoading: false, isAuthenticated: true });
    } catch {
      clearToken();
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.token);
    localStorage.setItem('bv_user', JSON.stringify(res.user));
    setState({ user: res.user, token: res.token, isLoading: false, isAuthenticated: true });
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, businessName?: string) => {
    const res = await authApi.signup({ name, email, password, businessName });
    setToken(res.token);
    localStorage.setItem('bv_user', JSON.stringify(res.user));
    setState({ user: res.user, token: res.token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getUser, User, LoginData } from '../hooks/api-user';
import api from '../api/axios';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginData) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem('api_token');
        if (stored) {
          setToken(stored);
          api.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
        }
        const u = await getUser();
        setUser(u);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (data: LoginData) => {
    const res = await apiLogin(data);
    // apiLogin stores token and sets defaults. Fetch the canonical user from /api/user
    try {
      const fullUser = await getUser();
      setUser(fullUser);
  console.debug('AuthProvider: logged in user', fullUser);
      // persist user snapshot
      try { localStorage.setItem('user', JSON.stringify(fullUser)); } catch {}
      const stored = localStorage.getItem('api_token');
      if (stored) setToken(stored);
      return { user: fullUser, message: res.message };
    } catch (e) {
      // fallback to returned user
      if (res?.user) {
        setUser(res.user);
        try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
      }
      const stored = localStorage.getItem('api_token');
      if (stored) setToken(stored);
      return res;
    }
  };

  const logout = async () => {
    await apiLogout().catch(() => {});
    setUser(null);
    setToken(null);
    try { localStorage.removeItem('api_token'); } catch {}
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

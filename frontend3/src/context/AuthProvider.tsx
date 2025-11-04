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
          console.log('AuthProvider: Found stored token, attempting to fetch user');
          
          try {
            const u = await getUser();
            setUser(u);
            console.log('AuthProvider: Successfully restored user from token', u);
          } catch (error) {
            // Token invalide ou expiré, nettoyer tout
            console.warn('AuthProvider: Token invalid or expired, cleaning up', error);
            localStorage.removeItem('api_token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            setToken(null);
          }
        } else {
          console.log('AuthProvider: No stored token found');
          setUser(null);
        }
      } catch (e) {
        console.error('AuthProvider: Initialization error', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (data: LoginData) => {
    try {
      const res = await apiLogin(data);
      
      // Wait a bit to ensure token is properly set in axios defaults
      await new Promise(resolve => setTimeout(resolve, 50));
      
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
        console.error('AuthProvider: Failed to fetch user after login', e);
        // fallback to returned user
        if (res?.user) {
          setUser(res.user);
          try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
        }
        const stored = localStorage.getItem('api_token');
        if (stored) setToken(stored);
        return res;
      }
    } catch (error) {
      console.error('AuthProvider: login error', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('AuthProvider: Logging out...');
    await apiLogout().catch((err) => {
      console.warn('AuthProvider: Logout API call failed', err);
    });
    
    // Nettoyer l'état et le localStorage
    setUser(null);
    setToken(null);
    try { 
      localStorage.removeItem('api_token');
      localStorage.removeItem('user'); // ⚠️ IMPORTANT: Supprimer aussi l'utilisateur
      console.log('AuthProvider: Cleared localStorage');
    } catch (err) {
      console.error('AuthProvider: Failed to clear localStorage', err);
    }
    delete api.defaults.headers.common['Authorization'];
    console.log('AuthProvider: Logout complete');
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

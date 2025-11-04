import api from '../api/axios';
import axios from 'axios';
import { ensureCsrf, rootBase, rootApi } from '../api/axios';

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

// 🔹 Connexion
export const login = async (data: LoginData) => {
  try {
    // Nettoyer les anciennes données avant le login
    try {
      localStorage.removeItem('api_token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      console.log('Login: cleaned old credentials');
    } catch (e) {
      console.debug('Could not clean old credentials', e);
    }
    
    // Token-based login using API route /api/login
    const res = await api.post<{ message: string; user: User; token: string }>('/login', data);
    const token = res.data.token;
    
    console.log('Login successful, token received:', token ? '✅' : '❌');
    
    // store token for subsequent API requests
    try {
      localStorage.setItem('api_token', token);
      // also set default header for the api instance IMMEDIATELY
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Token stored and headers updated');
    } catch (e) {
      console.error('Could not persist api token', e);
    }
    
    return { message: res.data.message, user: res.data.user } as LoginResponse;
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

// 🔹 Déconnexion
export const logout = async () => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    try { 
      localStorage.removeItem('api_token');
      localStorage.removeItem('user'); // Supprimer l'utilisateur du localStorage
      localStorage.clear(); // Nettoyer tout le localStorage pour être sûr
    } catch {}
    delete api.defaults.headers.common['Authorization'];
    console.log('Logout: all credentials cleared');
  }
};

// 🔹 Récupérer l'utilisateur connecté
export const getUser = async () => {
  const res = await api.get<User>('/user');
  return res.data;
};

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
  // Token-based login using API route /api/login
  const res = await api.post<{ message: string; user: User; token: string }>('/login', data);
  const token = res.data.token;
  // store token for subsequent API requests
  try {
    localStorage.setItem('api_token', token);
    // also set default header for the api instance
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    console.debug('Could not persist api token', e);
  }
  return { message: res.data.message, user: res.data.user } as LoginResponse;
};

// 🔹 Déconnexion
export const logout = async () => {
  try {
    await api.post('/logout');
  } finally {
    try { localStorage.removeItem('api_token'); } catch {}
    delete api.defaults.headers.common['Authorization'];
  }
};

// 🔹 Récupérer l'utilisateur connecté
export const getUser = async () => {
  const res = await api.get<User>('/user');
  return res.data;
};

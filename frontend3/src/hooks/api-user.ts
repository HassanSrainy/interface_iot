// src/api/auth-api.ts
import axios from "axios";

const API_URL = "http://localhost:8000/api"; // URL de ton API Laravel

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role:string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

// 🔹 Connexion
export const login = async (data: LoginData) => {
  const res = await axios.post<LoginResponse>(`${API_URL}/login`, data);
  return res.data;
};

// 🔹 Déconnexion
export const logout = async (token: string) => {
  await axios.post(
    `${API_URL}/logout`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// 🔹 Récupérer l'utilisateur connecté via token
export const getUser = async (token: string) => {
  const res = await axios.get<User>(`${API_URL}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

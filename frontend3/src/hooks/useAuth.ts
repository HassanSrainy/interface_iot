// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { login as apiLogin, logout as apiLogout, getUser, LoginData, User } from "./api-user";

export default function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Vérification du token et récupération de l'user
  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getUser(token);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        // Token invalide → reset
        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  // Connexion
  const login = async (data: LoginData) => {
    const res = await apiLogin(data);
    if (res?.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  // Déconnexion
  const logout = async () => {
    if (token) {
      await apiLogout(token).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return { user, token, loading, login, logout };
}

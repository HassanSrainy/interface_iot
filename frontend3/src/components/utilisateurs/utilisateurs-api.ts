import api from "../../api/axios";

export interface Clinique {
  id: number;
  nom: string;
  adresse?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  cliniques?: Clinique[];
}

// ✅ Interface pour les stats de la navbar
export interface UserNavbarStats {
  sensors_count: number;
  online_count: number;
  alerts_count: number;
}

/**
 * Récupérer tous les utilisateurs avec leurs cliniques
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users");
  return response.data;
};

/**
 * Créer un nouvel utilisateur + attribuer des cliniques
 */
export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  clinique_ids?: number[]; // tableau d'IDs de cliniques
}): Promise<User> => {
  const response = await api.post<User>("/users", userData);
  return response.data;
};

/**
 * Récupérer un utilisateur spécifique
 */
export const getUser = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

/**
 * Mettre à jour un utilisateur (et éventuellement ses cliniques)
 */
export const updateUser = async (
  id: number,
  updates: Partial<{
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
    clinique_ids: number[]; // possibilité de mettre à jour les cliniques liées
  }>
): Promise<User> => {
  const response = await api.put<User>(`/users/${id}`, updates);
  return response.data;
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/users/${id}`);
  return response.data;
};

/**
 * ✅ NOUVEAU : Récupérer les stats navbar (ultra-léger : ~100 bytes)
 * Retourne uniquement les compteurs nécessaires pour la navbar
 */
export const getUserNavbarStats = async (userId: number): Promise<UserNavbarStats> => {
  const response = await api.get<UserNavbarStats>(`/users/${userId}/navbar-stats`);
  return response.data;
};
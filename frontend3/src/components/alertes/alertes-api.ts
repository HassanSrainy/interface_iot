// src/lib/api/alertes-api.ts
import api from "../../api/axios";

/* ---------- Types ---------- */
export interface Sensor {
  id: string;
  matricule?: string;
}

export type RawStatut = "actif" | "inactif";

export interface Alerte {
  id: number;
  capteur_id?: number;
  mesure_id?: number | null;
  type: string;
  valeur?: number;
  date: string;
  statut: RawStatut;
  capteur?: Sensor;
}

/* ---------- API Calls ---------- */

// Récupérer toutes les alertes
export async function getAlertes(): Promise<Alerte[]> {
  const res = await api.get("/alertes");
  const data = res.data;
  return Array.isArray(data) ? data : data.data ?? [];
}
export async function getAlertesByUser(userId: number | string): Promise<Alerte[]> {
  // tentative d'appel le plus standard : /users/{id}/alertes
  try {
    const res = await api.get(`/users/${userId}/alertes`);
    const data = res.data;
    return Array.isArray(data) ? data : data.data ?? [];
  } catch (err) {
    // réessayer un autre chemin si besoin (commenté); tu peux adapter selon ton backend:
    // const res = await api.get(`/user/${userId}/alertes`);
    // ...
    throw err;
  }
}
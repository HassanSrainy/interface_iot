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
  critique?: boolean; // Nouveau: indique si l'alerte est critique (2ème mesure consécutive)
  date_resolution?: string | null; // Nouveau: date de résolution de l'alerte
  capteur?: Sensor;
}

export interface AlertCount {
  total_alertes?: number;
  active_alertes?: number;
}

export type AlertCountsMap = Record<string, AlertCount>;

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

export async function getAlertesCounts(ids?: Array<number | string>): Promise<AlertCountsMap> {
  const params = ids?.length ? { ids: ids.join(",") } : undefined;
  const res = await api.get("/capteurs/alertes/nbr", { params });
  const data = res.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as AlertCountsMap;
  }
  return {};
}

export async function getAlertesCountsByUser(userId: number, ids?: Array<number | string>): Promise<AlertCountsMap> {
  const params = ids?.length ? { ids: ids.join(",") } : undefined;
  const res = await api.get(`/users/${userId}/capteurs/alertes/nbr`, { params });
  const data = res.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as AlertCountsMap;
  }
  return {};
}
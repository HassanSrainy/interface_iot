// frontend3/src/components/sensors/sensor-api.ts
import api from '../../api/axios'; // adapte si nécessaire

// Types exportés directement depuis ce fichier
export interface Alerte {
  id: number;
  status: string; // "actif" | "inactif"
  lue: boolean;
  message?: string;
  date_creation?: string;
}

export interface Mesure {
  id?: number;
  date_mesure?: string; // format venant du backend (on normalisera côté front)
  valeur?: number;
  [k: string]: any;
}

export interface Sensor {
  id: number;
  matricule: string;
  nom?: string;
  label?: string;
  status?: "online" | "offline" | null;
  alertes?: Alerte[];
  mesures?: Mesure[]; // IMPORTANT : la propriété attendue côté front
  derniereMesure?: Mesure | null;
  [k: string]: any;
}

export interface SensorAlertCount {
  capteur_id: number;
  total_alertes: number;
  active_alertes: number;
}

// Fonctions API
export const getSensors = async (): Promise<Sensor[]> => {
  const res = await api.get('/capteurs');
  return res.data;
};

export const createSensor = async (data: Partial<Sensor>): Promise<Sensor> => {
  const res = await api.post('/capteurs', data);
  return res.data;
};

export const updateSensor = async (id: number, data: Partial<Sensor>): Promise<Sensor> => {
  const res = await api.put(`/capteurs/${id}`, data);
  return res.data;
};

export const deleteSensor = async (id: number): Promise<void> => {
  await api.delete(`/capteurs/${id}`);
};

// frontend3/src/components/sensors/sensor-api.ts

export interface AlertCountMap {
  [capteurId: number]: {
    total_alertes: number;
    active_alertes: number;
  };
}

/**
 * Récupère les compteurs d'alertes pour plusieurs capteurs en une seule requête
 */
export const getSensorsAlertCounts = async (sensorIds?: number[]): Promise<AlertCountMap> => {
  const params = sensorIds && sensorIds.length > 0 
    ? { ids: sensorIds.join(',') } 
    : {};
  
  const res = await api.get('/capteurs/alertes/nbr', { params });
  return res.data;
};

// --- ajout : récupérer les capteurs d'un utilisateur (utilise l'API axios 'api')
export const getSensorsByUser = async (userId: number): Promise<Sensor[]> => {
  const res = await api.get(`/users/${userId}/capteurs`);
  return res.data;
};

// --- ajout : récupérer capteurs par service (optionnel)
export const getSensorsByService = async (serviceId: number): Promise<Sensor[]> => {
  const res = await api.get(`/services/${serviceId}/capteurs`);
  return res.data;
};

// --- ajout optionnel : récupérer mesures d'un capteur (si nécessaire)
// frontend3/src/components/sensors/sensor-api.ts

export interface MesuresResponse {
  capteur_id: number;
  mesures: Mesure[];
  count: number;
}

/**
 * ✅ Récupérer les mesures d'un capteur spécifique avec filtres
 */
export const getSensorMesures = async (
  sensorId: number, 
  options?: {
    days?: number;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }
): Promise<MesuresResponse> => {
  const params: any = {};
  
  if (options?.days) params.days = options.days;
  if (options?.dateFrom) params.date_from = options.dateFrom;
  if (options?.dateTo) params.date_to = options.dateTo;
  if (options?.limit) params.limit = options.limit;
  
  const res = await api.get(`/capteurs/${sensorId}/mesures`, { params });
  return res.data;
};

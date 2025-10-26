// frontend3/src/components/sensors/sensor-api.ts
import api from '../../api/axios';

// Types exportés
export interface Alerte {
  id: number;
  status: string;
  lue: boolean;
  message?: string;
  date_creation?: string;
}

export interface Mesure {
  id?: number;
  date_mesure?: string;
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
  mesures?: Mesure[];
  derniereMesure?: Mesure | null;
  [k: string]: any;
}

export interface SensorAlertCount {
  capteur_id: number;
  total_alertes: number;
  active_alertes: number;
}

export interface AlertCountMap {
  [capteurId: number]: {
    total_alertes: number;
    active_alertes: number;
  };
}

export interface MesuresResponse {
  capteur_id: number;
  mesures: Mesure[];
  count: number;
}

// ===== FONCTIONS DE BASE =====

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

// ===== COMPTEURS D'ALERTES =====

/**
 * ✅ Récupère les compteurs d'alertes pour plusieurs capteurs en une seule requête
 */
export const getSensorsAlertCounts = async (sensorIds?: number[]): Promise<AlertCountMap> => {
  const params = sensorIds && sensorIds.length > 0 
    ? { ids: sensorIds.join(',') } 
    : {};
  
  const res = await api.get('/capteurs/alertes/nbr', { params });
  return res.data;
};

/**
 * ✅ Récupère le compteur d'alertes pour un capteur d'un utilisateur
 */
export const getSensorAlertCountByUser = async (
  userId: number, 
  sensorId: number
): Promise<SensorAlertCount> => {
  const res = await api.get(`/users/${userId}/capteurs/${sensorId}/alertes/nbr`);
  return res.data;
};

/**
 * ✅ Récupère les compteurs d'alertes pour plusieurs capteurs d'un utilisateur
 */
export const getSensorsAlertCountsByUser = async (
  userId: number,
  sensorIds?: number[]
): Promise<AlertCountMap> => {
  const params = sensorIds && sensorIds.length > 0 
    ? { ids: sensorIds.join(',') } 
    : {};
  
  const res = await api.get(`/users/${userId}/capteurs/alertes/nbr`, { params });
  return res.data;
};

// ===== CAPTEURS PAR UTILISATEUR =====

/**
 * ✅ Récupère les capteurs d'un utilisateur
 */
export const getSensorsByUser = async (userId: number): Promise<Sensor[]> => {
  const res = await api.get(`/users/${userId}/capteurs`);
  return res.data;
};

/**
 * ✅ Récupère les capteurs par service (optionnel)
 */
export const getSensorsByService = async (serviceId: number): Promise<Sensor[]> => {
  const res = await api.get(`/services/${serviceId}/capteurs`);
  return res.data;
};

// ===== MESURES =====

/**
 * ✅ Récupérer les mesures d'un capteur spécifique avec filtres (ADMIN)
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

/**
 * ✅ Récupérer les mesures d'un capteur spécifique pour un utilisateur
 */
/**
 * ✅ Récupérer les mesures d'un capteur spécifique pour un utilisateur
 * Supporte : hours, days, dateFrom/dateTo
 */
export const getSensorMesuresByUser = async (
  userId: number,
  sensorId: number, 
  options?: {
    hours?: number;      // ✅ NOUVEAU
    days?: number;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }
): Promise<MesuresResponse> => {
  const params: any = {};
  
  if (options?.hours) params.hours = options.hours;  // ✅ NOUVEAU
  if (options?.days) params.days = options.days;
  if (options?.dateFrom) params.dateFrom = options.dateFrom;  // ✅ Corrigé (pas date_from)
  if (options?.dateTo) params.dateTo = options.dateTo;        // ✅ Corrigé (pas date_to)
  if (options?.limit) params.limit = options.limit;
  
  const res = await api.get(`/users/${userId}/capteurs/${sensorId}/mesures`, { params });
  return res.data;
};

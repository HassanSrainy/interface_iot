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


export interface Sensor {
  id: number;
  matricule: string;
  status?: "online" | "offline" | null;
  alertes?: Alerte[];
  // tu peux ajouter d'autres champs si nécessaire
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

export const getSensorAlertCount = async (id: number): Promise<SensorAlertCount> => {
  const res = await api.get(`/capteurs/${id}/alertes/nbr`);
  return res.data;
};
// --- en haut du fichier (garde les autres exports) ---
export const getSensorsByUser = async (userId: number): Promise<Sensor[]> => {
  // si ton axios instance ajoute déjà l'Authorization header automatiquement, rien de spécial à faire
  const res = await api.get(`/users/${userId}/capteurs`);
  return res.data;
};
// frontend3/src/components/sensors/sensor-api.ts
// (place-la avec les autres exports API)

export const getSensorsByService = async (serviceId: number): Promise<Sensor[]> => {
  // Adapte l'endpoint selon ton API.
  // Possibilités courantes :
  //  - /services/{id}/capteurs
  //  - /capteurs?service_id={id}
  const res = await api.get(`/services/${serviceId}/capteurs`);
  return res.data;
};

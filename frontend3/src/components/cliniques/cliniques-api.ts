// frontend3/src/components/cliniques/cliniques.api.ts
import api from '../../api/axios';

export interface Clinique {
  id: number;
  nom: string;
  adresse: string;
  ville?: string;
}

export interface Floor {
  id: number;
  nom: string;
  clinique_id: number;
}

export interface Service {
  id: number;
  nom: string;
  floor_id: number;
}

export interface Capteur {
  id: number;
  nom: string;
  type: string;
  service_id: number;
  adresse_ip?: string;   // optionnel si parfois null
  adresse_mac?: string;  // optionnel
  status?: "online" | "offline"; // optionnel
}


// ----------------- CLINIQUES -----------------
export const getCliniques = async (): Promise<Clinique[]> => {
  const res = await api.get('/cliniques');
  return res.data;
};

export const createClinique = async (data: Partial<Clinique>): Promise<Clinique> => {
  const res = await api.post('/cliniques', data);
  return res.data;
};

export const updateClinique = async (id: number, data: Partial<Clinique>): Promise<Clinique> => {
  const res = await api.put(`/cliniques/${id}`, data);
  return res.data;
};

export const deleteClinique = async (id: number): Promise<void> => {
  await api.delete(`/cliniques/${id}`);
};

// ----------------- FLOORS -----------------
export const getFloorsByClinique = async (cliniqueId: number): Promise<Floor[]> => {
  const res = await api.get(`/cliniques/${cliniqueId}/floors`);
  return res.data;
};

export const createFloor = async (data: Partial<Floor>): Promise<Floor> => {
  const res = await api.post('/floors', data);
  return res.data;
};

export const updateFloor = async (id: number, data: Partial<Floor>): Promise<Floor> => {
  const res = await api.put(`/floors/${id}`, data);
  return res.data;
};

export const deleteFloor = async (id: number): Promise<void> => {
  await api.delete(`/floors/${id}`);
};

// ----------------- SERVICES -----------------
export const getServicesByFloor = async (floorId: number): Promise<Service[]> => {
  const res = await api.get(`/floors/${floorId}/services`);
  return res.data;
};

export const createService = async (data: Partial<Service>): Promise<Service> => {
  const res = await api.post('/services', data);
  return res.data;
};

export const updateService = async (id: number, data: Partial<Service>): Promise<Service> => {
  const res = await api.put(`/services/${id}`, data);
  return res.data;
};

export const deleteService = async (id: number): Promise<void> => {
  await api.delete(`/services/${id}`);
};

// ----------------- CAPTEURS -----------------
export const getCapteursByService = async (serviceId: number): Promise<Capteur[]> => {
  const res = await api.get(`/services/${serviceId}/capteurs`);
  return res.data;
};

export const createCapteur = async (data: Partial<Capteur>): Promise<Capteur> => {
  const res = await api.post('/capteurs', data);
  return res.data;
};

export const updateCapteur = async (id: number, data: Partial<Capteur>): Promise<Capteur> => {
  const res = await api.put(`/capteurs/${id}`, data);
  return res.data;
};

export const deleteCapteur = async (id: number): Promise<void> => {
  await api.delete(`/capteurs/${id}`);
};

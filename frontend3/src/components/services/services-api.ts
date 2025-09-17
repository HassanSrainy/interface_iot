// frontend3/src/components/services/services.api.ts
import api from '../../api/axios';

export interface Service {
  id: number;
  nom: string;
  floor_id: number;
}

export const getServices = async (): Promise<Service[]> => {
  const res = await api.get('/services');
  return res.data;
};

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

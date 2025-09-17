// frontend3/src/components/floors/floors.api.ts
import api from '../../api/axios';

export interface Floor {
  id: number;
  nom: string;
  clinique_id: number;
}

export const getFloors = async (): Promise<Floor[]> => {
  const res = await api.get('/floors');
  return res.data;
};

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

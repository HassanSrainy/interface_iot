// frontend3/src/components/families/families.api.ts
import api from '../../api/axios';

export interface Famille {
  id: number;
  famille: string;
  type_id: number;
}

export const getFamilies = async (): Promise<Famille[]> => {
  const res = await api.get('/familles');
  return res.data;
};

export const createFamily = async (data: Partial<Famille>): Promise<Famille> => {
  const res = await api.post('/familles', data);
  return res.data;
};

export const updateFamily = async (id: number, data: Partial<Famille>): Promise<Famille> => {
  const res = await api.put(`/familles/${id}`, data);
  return res.data;
};

export const deleteFamily = async (id: number): Promise<void> => {
  await api.delete(`/familles/${id}`);
};

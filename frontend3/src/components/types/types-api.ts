// frontend3/src/components/types/types-api.ts
import api from '../../api/axios';

export interface TypeEntity {
  id: number;
  nom?: string; // backend peut utiliser 'nom' ou 'type' -> front lira les 2 si besoin
  type?: string;
}

export const getTypes = async (): Promise<TypeEntity[]> => {
  const res = await api.get('/types');
  return res.data;
};

export const createType = async (payload: Partial<TypeEntity>): Promise<TypeEntity> => {
  const res = await api.post('/types', payload);
  return res.data;
};

export const updateType = async (id: number, payload: Partial<TypeEntity>): Promise<TypeEntity> => {
  const res = await api.put(`/types/${id}`, payload);
  return res.data;
};

export const deleteType = async (id: number): Promise<void> => {
  await api.delete(`/types/${id}`);
};

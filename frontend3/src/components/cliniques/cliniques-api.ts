// frontend3/src/components/cliniques/cliniques.api.ts
import api from '../../api/axios';

export interface Clinique {
  id: number;
  nom: string;
  adresse: string;
}

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

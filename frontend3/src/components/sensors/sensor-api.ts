// frontend3/src/components/sensors/sensor.api.ts
import api from '../../api/axios'; // adapte si nécessaire

import { Sensor } from './sensor-management'; // on réutilise ton interface

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

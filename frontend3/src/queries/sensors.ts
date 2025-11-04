import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSensors, getSensorsByUser, getSensorsAlertCounts, getSensorMesures, createSensor, updateSensor, deleteSensor } from '../components/sensors/sensor-api';
import { useAuth } from '../context/AuthProvider';
import { useIsAdmin } from '../hooks/useIsAdmin';

export function useSensors() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  
  return useQuery({
    queryKey: ['sensors', isAdmin ? 'admin' : 'user', user?.id],
    queryFn: () => {
      if (isAdmin) {
        return getSensors();
      } else {
        return getSensorsByUser(user?.id!);
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateSensor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
    },
  });
}

export function useUpdateSensor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateSensor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
    },
  });
}

export function useDeleteSensor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
    },
  });
}

export function useSensorsAlertCounts(sensorIds?: number[]) {
  return useQuery({
    queryKey: ['sensors', 'alertCounts', sensorIds?.join(',') ?? 'all'],
    queryFn: () => getSensorsAlertCounts(sensorIds),
    enabled: Array.isArray(sensorIds) ? sensorIds.length > 0 : true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

export function useSensorMesures(sensorId?: number, options?: { days?: number; dateFrom?: string; dateTo?: string; limit?: number }) {
  return useQuery({
    queryKey: [
      'sensor',
      sensorId,
      options?.days ?? null,
      options?.dateFrom ?? null,
      options?.dateTo ?? null,
      options?.limit ?? null,
    ],
    queryFn: () => {
      if (!sensorId) return Promise.resolve({ capteur_id: sensorId, mesures: [], count: 0 });
      return getSensorMesures(Number(sensorId), options);
    },
    enabled: !!sensorId,
    staleTime: 60 * 1000, // 1 minute pour les mesures
    gcTime: 3 * 60 * 1000,
  });
}

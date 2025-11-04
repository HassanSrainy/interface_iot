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
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 1000, // Refresh every 15 seconds for real-time status
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 1000, // Refresh every 15 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
    staleTime: 10 * 1000, // 10 seconds for real-time measurements
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: 20 * 1000, // Refresh every 20 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

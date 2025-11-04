import { useQuery } from '@tanstack/react-query';
import { getServices, getServicesByFloor } from '../components/services/services-api';

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: getServices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useServicesByFloor(floorId?: number | string) {
  return useQuery({
    queryKey: ['services', 'floor', floorId],
    queryFn: () => getServicesByFloor(Number(floorId)),
    enabled: !!floorId && floorId !== '',
    staleTime: 5 * 60 * 1000,
  });
}

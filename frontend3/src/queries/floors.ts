import { useQuery } from '@tanstack/react-query';
import { getFloors, getFloorsByClinique } from '../components/floors/floors-api';

export function useFloors() {
  return useQuery({
    queryKey: ['floors'],
    queryFn: getFloors,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFloorsByClinique(cliniqueId?: number | string) {
  return useQuery({
    queryKey: ['floors', 'clinique', cliniqueId],
    queryFn: () => getFloorsByClinique(Number(cliniqueId)),
    enabled: !!cliniqueId && cliniqueId !== '',
    staleTime: 5 * 60 * 1000,
  });
}

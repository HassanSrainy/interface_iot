import { useQuery } from '@tanstack/react-query';
import { getFamilies } from '../components/familles/familles-api';

export function useFamilies() {
  return useQuery({
    queryKey: ['families'],
    queryFn: getFamilies,
    staleTime: 5 * 60 * 1000, // 5 minutes - les familles changent rarement
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

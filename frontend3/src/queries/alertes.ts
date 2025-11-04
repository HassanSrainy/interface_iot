import { useQuery } from '@tanstack/react-query';
import { getAlertes, getAlertesByUser, getAlertesCounts, getAlertesCountsByUser } from '../components/alertes/alertes-api';
import { useAuth } from '../context/AuthProvider';
import { useIsAdmin } from '../hooks/useIsAdmin';

export function useAlertes() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  
  return useQuery({
    queryKey: ['alertes', isAdmin ? 'admin' : 'user', user?.id],
    queryFn: () => {
      if (isAdmin) {
        return getAlertes();
      } else {
        return getAlertesByUser(user?.id!);
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useAlertesCounts(ids?: Array<number | string>) {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  
  return useQuery({
    queryKey: ['alertes', 'counts', isAdmin ? 'admin' : 'user', user?.id, ids?.length ? ids.join(',') : 'all'],
    queryFn: () => {
      if (isAdmin) {
        return getAlertesCounts(ids);
      } else {
        return getAlertesCountsByUser(user?.id!, ids);
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

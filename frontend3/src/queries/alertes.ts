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
    staleTime: 10 * 1000, // 10 seconds - data considered fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - cache time
    refetchInterval: 15 * 1000, // Refresh every 15 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh on network reconnect
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
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 1000, // Refresh every 15 seconds for real-time badge updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

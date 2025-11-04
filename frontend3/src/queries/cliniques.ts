import { useQuery } from '@tanstack/react-query';
import * as cliniquesApi from '../components/cliniques/cliniques-api';
import { useAuth } from '../context/AuthProvider';
import { useIsAdmin } from '../hooks/useIsAdmin';

export function useCliniques() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  
  return useQuery({
    queryKey: ['cliniques', isAdmin ? 'admin' : 'user', user?.id],
    queryFn: () => {
      if (isAdmin) {
        return (cliniquesApi as any).getCliniques();
      } else {
        return (cliniquesApi as any).getCliniquesByUser(user?.id!);
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    select: (data: any) => {
      const cliniques = Array.isArray(data) ? data : (data as any)?.data ?? [];
      
      return cliniques.map((clinique: any) => {
        const capteursFromHierarchy = (clinique.floors || []).flatMap((floor: any) =>
          (floor.services || []).flatMap((service: any) => service.capteurs || [])
        );

        const capteursEnLigne = capteursFromHierarchy.filter((c: any) => 
          String(c?.status || "").toLowerCase() === "online"
        ).length;

        const servicesFromHierarchy = (clinique.floors || []).flatMap((floor: any) => 
          floor.services || []
        );

        const alertesFromCapteurs = capteursFromHierarchy.reduce((acc: any, capteur: any) => {
          const alertesActives = (capteur.alertes || []).filter((a: any) => 
            String(a?.statut || a?.status || "").toLowerCase() === "active" ||
            String(a?.statut || a?.status || "").toLowerCase() === "actif"
          ).length;
          const totalAlertes = (capteur.alertes || []).length;
          
          return {
            actives: acc.actives + alertesActives,
            total: acc.total + totalAlertes
          };
        }, { actives: 0, total: 0 });

        return {
          id: String(clinique.id),
          nom: clinique.nom ?? `Clinique ${clinique.id}`,
          adresse: clinique.adresse ?? "",
          floors: clinique.floors ?? [],
          capteurs: capteursFromHierarchy,
          capteursEnLigne,
          services: servicesFromHierarchy,
          alertesActives: alertesFromCapteurs.actives,
          totalAlertes: alertesFromCapteurs.total,
        };
      });
    }
  });
}

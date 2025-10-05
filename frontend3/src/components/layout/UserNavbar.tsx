// src/components/layout/UserNavbar.tsx
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { LogOut, User, Bell, Wifi } from "lucide-react";
import { getSensorsByUser } from "../sensors/sensor-api";
import { getAlertesByUser } from "../alertes/alertes-api";

interface Props {
  user: { id: number; email: string } | null;
  onLogout: () => void;
}

export default function UserNavbar({ user, onLogout }: Props) {
  const [sensorsCount, setSensorsCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [sensorsData, alertesData] = await Promise.all([
          getSensorsByUser(user.id),
          getAlertesByUser(user.id),
        ]);

        if (!mounted) return;

        // Compter les capteurs
        setSensorsCount(sensorsData.length);

        // Compter les capteurs en ligne
        const online = sensorsData.filter(
          (s: any) => String(s.status).toLowerCase() === "online"
        );
        setOnlineCount(online.length);

        // Compter les alertes actives
        const actives = alertesData.filter(
          (a: any) =>
            String(a.status).toLowerCase() === "actif" || a.actif === 1
        );
        setAlertsCount(actives.length);
      } catch (error) {
        console.error("Erreur lors du chargement des données utilisateur :", error);
        setSensorsCount(0);
        setOnlineCount(0);
        setAlertsCount(0);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh toutes les 30s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  return (
    <nav className="border-b bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Titre + statut capteurs */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Wifi className="h-6 w-6 text-primary" />
              <h1 className="font-bold">Espace Utilisateur</h1>
            </div>

            <Badge variant="outline" className="text-xs">
              {loading
                ? "Chargement..."
                : `${onlineCount}/${sensorsCount} capteurs connectés`}
            </Badge>
          </div>

          {/* Profil / alertes / logout */}
          <div className="flex items-center space-x-4">
            {/* Bouton alertes */}
            <div className="relative">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[0.6rem] font-bold">
                  {alertsCount}
                </span>
              )}
            </div>

            {/* Profil utilisateur */}
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user?.email ?? "Invité"}</span>
            </div>

            {/* Logout */}
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

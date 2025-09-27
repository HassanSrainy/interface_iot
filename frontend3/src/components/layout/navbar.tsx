// frontend3/src/components/layout/navbar.tsx
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { LogOut, User, Bell, Wifi } from "lucide-react";
import { getSensors, Sensor } from "../sensors/sensor-api";

interface NavbarProps {
  user: { email: string };
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const data = await getSensors();
        setSensors(data);
      } catch (err) {
        console.error("Erreur lors du chargement des capteurs :", err);
      }
    };

    fetchSensors();
    const interval = setInterval(fetchSensors, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalSensors = sensors.length;
  const sensorsOnline = sensors.filter(s => s.status === "online").length;

  const totalActiveAlerts = sensors.reduce((acc, s) => {
    if (!s.alertes) return acc;
    return acc + s.alertes.filter((a: any) =>
      (a.status && a.status.toLowerCase() === "actif") ||
      (a.actif === 1)
    ).length;
  }, 0);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Left: Wifi + Titre + Capteurs en ligne */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Wifi className="h-6 w-6 text-primary" />
              <h1 className="font-bold">Dashboard IoT</h1>
            </div>

            {/* Badge capteurs en ligne */}
            <Badge variant="outline" className="text-xs">
              {`${sensorsOnline}/${totalSensors} capteurs en ligne`}
            </Badge>
          </div>

          {/* Right: Alertes + Utilisateur + Déconnexion */}
          <div className="flex items-center space-x-4">

            {/* Icon notification avec badge */}
            <div className="relative">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              {totalActiveAlerts > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[0.6rem] font-bold">
                  {totalActiveAlerts}
                </span>
              )}
            </div>

            {/* Utilisateur */}
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user.email}</span>
            </div>

            {/* Bouton déconnexion */}
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

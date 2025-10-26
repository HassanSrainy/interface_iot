import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { LogOut, User, Bell, Wifi } from "lucide-react";

interface Props {
  user: { id: number; email: string } | null;
  onLogout: () => void;
  sensorsCount: number;
  onlineCount: number;
  alertsCount: number;
  loading?: boolean;
}

export default function UserNavbar({ 
  user, 
  onLogout, 
  sensorsCount, 
  onlineCount, 
  alertsCount,
  loading = false 
}: Props) {
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
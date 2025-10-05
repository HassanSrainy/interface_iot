import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, CheckCircle, XCircle, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { getAlertesByUser, Alerte } from "../alertes/alertes-api";
import useAuth from "../../hooks/useAuth";

// --- Helpers ---
const isActiveStatus = (s?: string) => String(s ?? "").toLowerCase() === "actif";
const isResolvedStatus = (s?: string) =>
  ["inactif", "resolue"].includes(String(s ?? "").toLowerCase());

const getAlertIcon = (type: string) => {
  switch ((type || "").toLowerCase()) {
    case "deconnexion":
      return <WifiOff className="h-4 w-4" />;
    case "seuil_min":
    case "seuil_max":
      return <AlertTriangle className="h-4 w-4" />;
    case "erreur":
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getAlertColor = (type: string, statut?: string) => {
  const s = String(statut ?? "").toLowerCase();
  if (["resolue", "inactif"].includes(s)) return "text-green-600";
  if (s === "ignoree") return "text-gray-500";
  switch ((type || "").toLowerCase()) {
    case "deconnexion":
    case "erreur":
      return "text-red-600";
    case "seuil_min":
    case "seuil_max":
      return "text-orange-600";
    default:
      return "text-red-600";
  }
};

const getAlertMessage = (alerte: Alerte) => {
  switch ((alerte.type || "").toLowerCase()) {
    case "deconnexion":
      return "Capteur déconnecté";
    case "seuil_min":
      return `Valeur sous le seuil minimum (${alerte.valeur ?? "?"} < seuil)`;
    case "seuil_max":
      return `Valeur au-dessus du seuil maximum (${alerte.valeur ?? "?"} > seuil)`;
    case "erreur":
      return "Erreur capteur";
    default:
      return "Alerte capteur";
  }
};

const formatDate = (s: string | null) => {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString("fr-FR");
  } catch {
    return s;
  }
};

// --- Component ---
export function AlertsPanelUser({
  autoRefresh = true,
  refreshInterval = 10000,
}: {
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  const { user } = useAuth();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertes = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getAlertesByUser(user.id);
      setAlertes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement alertes utilisateur:", err);
      setAlertes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertes();
    if (!autoRefresh) return;
    const t = setInterval(fetchAlertes, refreshInterval);
    return () => clearInterval(t);
  }, [user]);

  const actives = alertes.filter((a) => isActiveStatus(a.statut));
  const resolved = alertes.filter((a) => isResolvedStatus(a.statut));

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Alertes utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Chargement des alertes...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* top bar : refresh */}
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchAlertes}
          title="Rafraîchir"
          aria-label="Rafraîchir les alertes"
          disabled={loading}
          className="p-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{actives.length}</div>
            <p className="text-xs text-muted-foreground">Nécessitent une attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Résolues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolved.length}</div>
            <p className="text-xs text-muted-foreground">Problèmes résolus</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes actives */}
      {actives.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Alertes Actives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {actives.map((alerte) => {
              const capteur = (alerte.capteur as any) ?? {};
              const capteurLabel = capteur.matricule ?? capteur.id ?? `#${alerte.capteur_id ?? alerte.id}`;
              return (
                <div key={alerte.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={getAlertColor(alerte.type ?? "", alerte.statut)}>
                      {getAlertIcon(alerte.type ?? "")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{capteurLabel}</span>
                        <Badge variant="destructive" className="text-xs">
                          {(alerte.type ?? "").replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{getAlertMessage(alerte)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(alerte.date)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Aucune alerte active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Aucune alerte nécessitant une action.</div>
          </CardContent>
        </Card>
      )}

      {/* Alertes résolues */}
      {resolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertes Résolues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resolved.slice(0, 5).map((alerte) => {
              const capteur = (alerte.capteur as any) ?? {};
              const capteurLabel = capteur.matricule ?? capteur.id ?? `#${alerte.capteur_id ?? alerte.id}`;
              return (
                <div key={alerte.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <span className="text-sm font-medium">{capteurLabel}</span>
                      <p className="text-xs text-muted-foreground">{getAlertMessage(alerte)} - Résolu</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">Résolu</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AlertsPanelUser;

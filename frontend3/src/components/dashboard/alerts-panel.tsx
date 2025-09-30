// src/components/dashboard/alerts-panel.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, CheckCircle, XCircle, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { getAlertes, Alerte } from "../alertes/alertes-api"; // <-- utiliser l'API centralisée

// --- Helpers & small utils ---
const isActiveStatus = (s?: string) => String(s ?? "").toLowerCase() === "actif";
const isResolvedStatus = (s?: string) =>
  String(s ?? "").toLowerCase() === "inactif" || String(s ?? "").toLowerCase() === "resolue";

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
  if (String(statut ?? "").toLowerCase() === "resolue" || String(statut ?? "").toLowerCase() === "inactif")
    return "text-green-600";
  if (String(statut ?? "").toLowerCase() === "ignoree") return "text-gray-500";

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
export function AlertsPanel({
  autoRefresh = true,
  refreshInterval = 10000,
}: {
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAlertes = async () => {
    try {
      setLoading(true);
      const data = await getAlertes();
      setAlertes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement alertes:", err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filtrages
  const actives = alertes.filter((a) => isActiveStatus(a.statut));
  const resolved = alertes.filter((a) => isResolvedStatus(a.statut));

  // Si on est en train de charger — afficher uniquement le loader
  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Alertes</CardTitle>
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
        <div className="flex items-center gap-3">
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
      </div>

      {/* KPI row (Actives & Résolues) */}
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

      {/* Active alerts list */}
      {actives.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Alertes Actives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {actives.map((alerte) => {
              const capteur = (alerte.capteur as any) ?? {};
              const capteurLabel = capteur.matricule ?? capteur.id ?? `#${alerte.capteur_id ?? alerte.id}`;

              // attempt to read nested relations safely (may be undefined)
              const cliniqueNom = (capteur?.service as any)?.floor?.clinique?.nom ?? "";
              const serviceNom = (capteur?.service as any)?.nom ?? "";

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

                      {(cliniqueNom || serviceNom) && (
                        <p className="text-xs text-muted-foreground">
                          {cliniqueNom ? `${cliniqueNom}` : ""}{cliniqueNom && serviceNom ? " - " : ""}{serviceNom}
                        </p>
                      )}

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
            <div className="text-sm text-muted-foreground">Aucune alerte nécessitant une action pour le moment.</div>
          </CardContent>
        </Card>
      )}

      {/* Recently resolved */}
      {resolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertes Récemment Résolues</CardTitle>
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

export default AlertsPanel;

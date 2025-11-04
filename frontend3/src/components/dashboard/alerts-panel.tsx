// src/components/dashboard/alerts-panel.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, CheckCircle, XCircle, WifiOff, RefreshCw, AlertOctagon } from "lucide-react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alerte } from "../alertes/alertes-api";
import { useAlertes } from "../../queries/alertes";
import { ChartTimeFilter } from "../charts/ChartTimeFilter";

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
  const alertesQuery = useAlertes();
  const alertes = alertesQuery.data || [];
  const loading = alertesQuery.isLoading;
  
  const [activePeriod, setActivePeriod] = useState<string>('all');
  const [resolvedPeriod, setResolvedPeriod] = useState<string>('today');
  const [showResolved, setShowResolved] = useState(false);

  // filtrages
  const allActives = alertes.filter((a) => isActiveStatus(a.statut));
  const resolved = alertes.filter((a) => isResolvedStatus(a.statut));
  
  // Filtrer les alertes actives par période
  const getFilteredActiveAlerts = () => {
    const now = new Date();
    const filtered = allActives.filter((alerte) => {
      if (!alerte.date) return false;
      
      // Parse date string to Date object
      const alertDate = new Date(alerte.date);
      
      // Debug logging
      if (allActives.length > 0 && allActives.indexOf(alerte) === 0) {
        console.log('[AlertsPanel] Filter debug:', {
          activePeriod,
          totalActives: allActives.length,
          firstDate: alerte.date,
          parsedDate: alertDate,
          now,
          isToday: alertDate.toDateString() === now.toDateString()
        });
      }
      
      switch (activePeriod) {
        case 'today':
          return alertDate.toDateString() === now.toDateString();
        case '7days':
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          return alertDate >= sevenDaysAgo;
        case '30days':
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return alertDate >= thirtyDaysAgo;
        case 'all':
        default:
          return true;
      }
    });
    
    console.log('[AlertsPanel] Filtered actives:', {
      period: activePeriod,
      total: allActives.length,
      filtered: filtered.length
    });
    
    return filtered;
  };
  
  // Filtrer les alertes résolues par période
  const getFilteredResolvedAlerts = () => {
    const now = new Date();
    return resolved.filter((alerte) => {
      if (!alerte.date_resolution) return false;
      const resolutionDate = new Date(alerte.date_resolution);
      
      switch (resolvedPeriod) {
        case 'today':
          return resolutionDate.toDateString() === now.toDateString();
        case '7days':
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          return resolutionDate >= sevenDaysAgo;
        default:
          return true;
      }
    });
  };
  
  const actives = getFilteredActiveAlerts();
  const filteredResolved = getFilteredResolvedAlerts();

  // Si on est en train de charger — afficher uniquement le loader
  if (loading && alertes.length === 0) {
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
            onClick={() => alertesQuery.refetch()}
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
            <p className="text-xs text-muted-foreground">
              {activePeriod === 'today' ? "Aujourd'hui" : 
               activePeriod === '7days' ? "7 derniers jours" :
               activePeriod === '30days' ? "30 derniers jours" : "Au total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Résolues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filteredResolved.length}</div>
            <p className="text-xs text-muted-foreground">
              {resolvedPeriod === 'today' ? "Aujourd'hui" : 
               resolvedPeriod === '7days' ? "7 derniers jours" : "Au total"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active alerts list */}
      {actives.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alertes Actives</CardTitle>
            <Select value={activePeriod} onValueChange={setActivePeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            {actives.map((alerte) => {
              const capteur = (alerte.capteur as any) ?? {};
              const capteurLabel = capteur.matricule ?? capteur.id ?? `#${alerte.capteur_id ?? alerte.id}`;
              const isCritique = (alerte as any).critique === true || (alerte as any).critique === 1;

              // attempt to read nested relations safely (may be undefined)
              const cliniqueNom = (capteur?.service as any)?.floor?.clinique?.nom ?? "";
              const serviceNom = (capteur?.service as any)?.nom ?? "";

              return (
                <div 
                  key={alerte.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    isCritique ? 'bg-red-50 border-red-300' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={getAlertColor(alerte.type ?? "", alerte.statut)}>
                      {isCritique ? (
                        <AlertOctagon className="h-5 w-5 text-red-600" />
                      ) : (
                        getAlertIcon(alerte.type ?? "")
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{capteurLabel}</span>
                        {isCritique && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            🔴 CRITIQUE
                          </Badge>
                        )}
                        <Badge variant={isCritique ? "destructive" : "outline"} className="text-xs">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alertes Actives</CardTitle>
            <Select value={activePeriod} onValueChange={setActivePeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {allActives.length === 0 
                ? "Aucune alerte active pour le moment."
                : `Aucune alerte active pour ${
                    activePeriod === 'today' ? "aujourd'hui" : 
                    activePeriod === '7days' ? "les 7 derniers jours" :
                    activePeriod === '30days' ? "les 30 derniers jours" : "cette période"
                  }.`
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently resolved */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alertes Résolues</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={resolvedPeriod} onValueChange={setResolvedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="all">Toutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredResolved.length > 0 ? (
            <div className="space-y-2">
              {filteredResolved.slice(0, 10).map((alerte) => {
                const capteur = (alerte.capteur as any) ?? {};
                const capteurLabel = capteur.matricule ?? capteur.id ?? `#${alerte.capteur_id ?? alerte.id}`;
                const dateResolution = (alerte as any).date_resolution 
                  ? formatDate((alerte as any).date_resolution)
                  : 'N/A';
                
                return (
                  <div key={alerte.id} className="flex items-center justify-between p-3 border rounded bg-green-50">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{capteurLabel}</span>
                          <Badge variant="outline" className="text-xs">
                            {(alerte.type ?? "").replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{getAlertMessage(alerte)}</p>
                        <p className="text-xs text-green-600">Résolu le: {dateResolution}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                      Résolu
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Aucune alerte résolue pour cette période
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertsPanel;

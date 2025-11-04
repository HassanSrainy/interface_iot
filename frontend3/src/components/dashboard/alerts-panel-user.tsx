import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, CheckCircle, XCircle, WifiOff, RefreshCw, AlertOctagon } from "lucide-react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alerte } from "../alertes/alertes-api";
import { useAuth } from "../../hooks/useAuth";
import { useAlertes } from "../../queries/alertes";

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
  const { data: alertes = [], isLoading, refetch } = useAlertes();
  const [activePeriod, setActivePeriod] = useState<string>('all');
  const [resolvedPeriod, setResolvedPeriod] = useState<string>('today');

  const allActives = alertes.filter((a) => isActiveStatus(a.statut));
  const resolved = alertes.filter((a) => isResolvedStatus(a.statut));
  
  // Filtrer les alertes actives par période
  const getFilteredActiveAlerts = () => {
    const now = new Date();
    return allActives.filter((alerte) => {
      if (!alerte.date) return false;
      const alertDate = new Date(alerte.date);
      
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

  if (isLoading) {
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
          onClick={() => refetch()}
          title="Rafraîchir"
          aria-label="Rafraîchir les alertes"
          disabled={isLoading}
          className="p-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
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

      {/* Alertes actives */}
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
                      <div className="flex items-center space-x-2 mb-1">
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
      {filteredResolved.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Alertes Résolues</CardTitle>
              <Select value={resolvedPeriod} onValueChange={(value: any) => setResolvedPeriod(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sélectionner période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="7days">7 derniers jours</SelectItem>
                  <SelectItem value="all">Toutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredResolved.slice(0, 10).map((alerte) => {
              const capteur = (alerte.capteur as any) ?? {};
              const capteurLabel = capteur.matricule ?? capteur.id ?? `#${alerte.capteur_id ?? alerte.id}`;
              return (
                <div key={alerte.id} className="flex items-start space-x-3 p-3 border rounded bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{capteurLabel}</span>
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-800">Résolu</Badge>
                      <Badge variant="outline" className="text-xs">
                        {(alerte.type ?? "").replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{getAlertMessage(alerte)}</p>
                    {alerte.date_resolution && (
                      <p className="text-xs text-green-700 mt-1">
                        Résolu le {formatDate(alerte.date_resolution)}
                      </p>
                    )}
                  </div>
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

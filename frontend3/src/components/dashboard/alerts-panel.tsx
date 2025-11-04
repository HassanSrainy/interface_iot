// src/components/dashboard/alerts-panel.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, CheckCircle, XCircle, WifiOff, RefreshCw, AlertOctagon, ChevronLeft, ChevronRight } from "lucide-react";
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
  
  // États de pagination
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [resolvedPageIndex, setResolvedPageIndex] = useState(0);
  const [activeItemsPerPage, setActiveItemsPerPage] = useState(5);
  const [resolvedItemsPerPage, setResolvedItemsPerPage] = useState(5);

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
  
  // Pagination pour alertes actives
  const activeTotalPages = Math.max(1, Math.ceil(actives.length / activeItemsPerPage));
  const activeStartIndex = activePageIndex * activeItemsPerPage;
  const activePaginatedAlerts = actives.slice(activeStartIndex, activeStartIndex + activeItemsPerPage);
  
  // Pagination pour alertes résolues
  const resolvedTotalPages = Math.max(1, Math.ceil(filteredResolved.length / resolvedItemsPerPage));
  const resolvedStartIndex = resolvedPageIndex * resolvedItemsPerPage;
  const resolvedPaginatedAlerts = filteredResolved.slice(resolvedStartIndex, resolvedStartIndex + resolvedItemsPerPage);
  
  // Reset pagination quand les filtres changent
  const handleActivePeriodChange = (value: string) => {
    setActivePeriod(value);
    setActivePageIndex(0);
  };
  
  const handleResolvedPeriodChange = (value: string) => {
    setResolvedPeriod(value);
    setResolvedPageIndex(0);
  };

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

      {/* Active alerts list & Resolved alerts - Côte à côte */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Alertes Actives */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Alertes Actives</CardTitle>
            <Select value={activePeriod} onValueChange={handleActivePeriodChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="7days">7 jours</SelectItem>
                <SelectItem value="30days">30 jours</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {activePaginatedAlerts.length > 0 ? (
              activePaginatedAlerts.map((alerte) => {
                const capteur = (alerte.capteur as any) ?? {};
                const capteurLabel = capteur.matricule ?? capteur.id ?? `#${alerte.capteur_id ?? alerte.id}`;
                const isCritique = (alerte as any).critique === true || (alerte as any).critique === 1;

                const cliniqueNom = (capteur?.service as any)?.floor?.clinique?.nom ?? "";
                const serviceNom = (capteur?.service as any)?.nom ?? "";

                return (
                  <div 
                    key={alerte.id} 
                    className={`flex items-start justify-between p-3 border rounded-lg ${
                      isCritique ? 'bg-red-50 border-red-300' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={getAlertColor(alerte.type ?? "", alerte.statut)}>
                        {isCritique ? (
                          <AlertOctagon className="h-5 w-5 text-red-600 mt-0.5" />
                        ) : (
                          <div className="mt-0.5">{getAlertIcon(alerte.type ?? "")}</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-medium text-sm">{capteurLabel}</span>
                          {isCritique && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              CRITIQUE
                            </Badge>
                          )}
                        </div>
                        <Badge variant={isCritique ? "destructive" : "outline"} className="text-xs mt-1">
                          {(alerte.type ?? "").replace("_", " ")}
                        </Badge>

                        <p className="text-sm text-muted-foreground mt-1">{getAlertMessage(alerte)}</p>

                        {(cliniqueNom || serviceNom) && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {cliniqueNom ? `${cliniqueNom}` : ""}{cliniqueNom && serviceNom ? " - " : ""}{serviceNom}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-1">{formatDate(alerte.date)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">
                {allActives.length === 0 
                  ? "Aucune alerte active"
                  : `Aucune alerte active pour ${
                      activePeriod === 'today' ? "aujourd'hui" : 
                      activePeriod === '7days' ? "les 7 derniers jours" :
                      activePeriod === '30days' ? "les 30 derniers jours" : "cette période"
                    }`
                }
              </div>
            )}
          </CardContent>
          
          {/* Pagination alertes actives */}
          {actives.length > 0 && (
            <div className="px-6 pb-4 border-t pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Page {activePageIndex + 1} / {activeTotalPages} • {actives.length} alerte{actives.length > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(activeItemsPerPage)} onValueChange={(v) => { setActiveItemsPerPage(Number(v)); setActivePageIndex(0); }}>
                  <SelectTrigger className="w-[100px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 / page</SelectItem>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="15">15 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivePageIndex(p => Math.max(0, p - 1))}
                  disabled={activePageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivePageIndex(p => Math.min(activeTotalPages - 1, p + 1))}
                  disabled={activePageIndex >= activeTotalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Alertes Résolues */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Alertes Résolues</CardTitle>
            <Select value={resolvedPeriod} onValueChange={handleResolvedPeriodChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="7days">7 jours</SelectItem>
                <SelectItem value="all">Toutes</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {resolvedPaginatedAlerts.length > 0 ? (
              resolvedPaginatedAlerts.map((alerte) => {
                const capteur = (alerte.capteur as any) ?? {};
                const capteurLabel = capteur.matricule ?? capteur.id ?? `#${alerte.capteur_id ?? alerte.id}`;
                const dateResolution = (alerte as any).date_resolution 
                  ? formatDate((alerte as any).date_resolution)
                  : 'N/A';
                
                return (
                  <div key={alerte.id} className="flex items-start justify-between p-3 border rounded-lg bg-green-50">
                    <div className="flex items-start space-x-3 flex-1">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{capteurLabel}</span>
                          <Badge variant="outline" className="text-xs">
                            {(alerte.type ?? "").replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{getAlertMessage(alerte)}</p>
                        <p className="text-xs text-green-600 mt-1">Résolu: {dateResolution}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">
                Aucune alerte résolue pour cette période
              </div>
            )}
          </CardContent>
          
          {/* Pagination alertes résolues */}
          {filteredResolved.length > 0 && (
            <div className="px-6 pb-4 border-t pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Page {resolvedPageIndex + 1} / {resolvedTotalPages} • {filteredResolved.length} alerte{filteredResolved.length > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(resolvedItemsPerPage)} onValueChange={(v) => { setResolvedItemsPerPage(Number(v)); setResolvedPageIndex(0); }}>
                  <SelectTrigger className="w-[100px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 / page</SelectItem>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="15">15 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResolvedPageIndex(p => Math.max(0, p - 1))}
                  disabled={resolvedPageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResolvedPageIndex(p => Math.min(resolvedTotalPages - 1, p + 1))}
                  disabled={resolvedPageIndex >= resolvedTotalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default AlertsPanel;

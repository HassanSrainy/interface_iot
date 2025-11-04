import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { FilterBar } from "../layout/FilterBar";
import { CustomSelect, CustomSelectItem } from "../ui/custom-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { TablePagination } from "../ui/table-pagination";
import {
  WifiOff,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  RefreshCw,
  Clock,
  Cpu,
  AlertOctagon,
  Zap,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { Alerte, RawStatut } from "./alertes-api";
import { useAlertes } from "../../queries/alertes";

/* ---------- Helpers ---------- */
const isActiveStatus = (s: RawStatut) => s === "actif";
const isInactiveStatus = (s: RawStatut) => s === "inactif";

const isDeconnexion = (t?: string) =>
  !!t && (t.toLowerCase().includes("deconn") || t.toLowerCase().includes("panne"));
const isHigh = (t?: string) => {
  const tl = (t ?? "").toLowerCase();
  return tl.includes("high") || tl.includes("haut") || tl.includes("max");
};
const isLow = (t?: string) => {
  const tl = (t ?? "").toLowerCase();
  return (
    tl.includes("lower") ||
    tl.includes("bas") ||
    tl.includes("min")
  );
};

/* ---------- Component (no JSX namespace types) ---------- */
export function AlertesManagement() {
  // Use React Query hook for automatic role-based filtering
  const { data: alertesData = [], isLoading, refetch } = useAlertes();
  
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "actif" | "inactif">(
    "actif" // Par défaut: afficher les alertes actives
  );
  const [filterType, setFilterType] = useState<"all" | string>("all");
  const [filterCritique, setFilterCritique] = useState<"all" | "critique" | "non-critique">("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const refresh = async () => {
    setError(null);
    try {
      await refetch();
    } catch (err: any) {
      setError(err?.message ?? "Erreur réseau");
    }
  };

  /* counts */
  const counts = useMemo(() => {
    const total = alertesData.length;
    const actif = alertesData.filter((a) => isActiveStatus(a.statut)).length;
    const inactif = alertesData.filter((a) => isInactiveStatus(a.statut)).length;
    const critiques = alertesData.filter((a) => (a as any).critique === true || (a as any).critique === 1).length;
    const critiquesActives = alertesData.filter((a) => 
      isActiveStatus(a.statut) && ((a as any).critique === true || (a as any).critique === 1)
    ).length;

    const deconn = alertesData.filter((a) => isDeconnexion(a.type));
    const high = alertesData.filter((a) => isHigh(a.type));
    const low = alertesData.filter((a) => isLow(a.type));

    const count = (arr: Alerte[]) => ({
      total: arr.length,
      actif: arr.filter((a) => isActiveStatus(a.statut)).length,
      inactif: arr.filter((a) => isInactiveStatus(a.statut)).length,
    });

    return {
      total,
      actif,
      inactif,
      critiques,
      critiquesActives,
      deconnexion: count(deconn),
      high: count(high),
      low: count(low),
    };
  }, [alertesData]);

  const lastUpdated = useMemo(() => {
    if (!alertesData.length) return null;
    const timestamps = alertesData
      .map((a) => {
        const date = new Date(a.date);
        return Number.isNaN(date.getTime()) ? null : date.getTime();
      })
      .filter((value): value is number => value !== null);
    if (!timestamps.length) return null;
    const latest = new Date(Math.max(...timestamps));
    return latest.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [alertesData]);

  const statHighlights = useMemo(() => {
    const activeRate = counts.total ? Math.round((counts.actif / counts.total) * 100) : 0;
    const resolvedRate = counts.total ? Math.round((counts.inactif / counts.total) * 100) : 0;
    const criticalRate = counts.total ? Math.round((counts.critiques / counts.total) * 100) : 0;

    return [
      {
        id: "total",
        label: "Total alertes",
        value: counts.total,
        description: `${counts.critiques} critiques enregistrées`,
        trend: `${activeRate}% actuellement actives`,
        icon: AlertTriangle,
        iconClass: "bg-red-50 text-red-600",
        valueClass: "text-slate-900",
      },
      {
        id: "actives",
        label: "Alertes actives",
        value: counts.actif,
        description: "En cours de traitement",
        trend: `${activeRate}% du volume total`,
        icon: Zap,
        iconClass: "bg-amber-50 text-amber-600",
        valueClass: "text-amber-600",
      },
      {
        id: "critiques",
        label: "Alertes critiques",
        value: counts.critiquesActives,
        description: `${counts.critiques} critiques cumulées`,
        trend: `${criticalRate}% du total des alertes`,
        icon: AlertOctagon,
        iconClass: "bg-red-50 text-red-600",
        valueClass: "text-red-600",
      },
      {
        id: "resolues",
        label: "Alertes résolues",
        value: counts.inactif,
        description: "Clôturées avec succès",
        trend: `${resolvedRate}% déjà résolues`,
        icon: CheckCircle2,
        iconClass: "bg-emerald-50 text-emerald-600",
        valueClass: "text-emerald-600",
      },
    ];
  }, [counts]);

  const categoryCards = useMemo(() => [
    {
      id: "deconnexion",
      title: "Déconnexions",
      description: "Capteurs hors ligne",
      icon: WifiOff,
      total: counts.deconnexion.total,
      actif: counts.deconnexion.actif,
      inactif: counts.deconnexion.inactif,
      iconClass: "bg-rose-50 text-rose-600",
    },
    {
      id: "high",
      title: "Seuil dépassé (max)",
      description: "Valeurs supérieures au seuil",
      icon: TrendingUp,
      total: counts.high.total,
      actif: counts.high.actif,
      inactif: counts.high.inactif,
      iconClass: "bg-orange-50 text-orange-600",
    },
    {
      id: "low",
      title: "Seuil dépassé (min)",
      description: "Valeurs inférieures au seuil",
      icon: TrendingDown,
      total: counts.low.total,
      actif: counts.low.actif,
      inactif: counts.low.inactif,
      iconClass: "bg-blue-50 text-blue-600",
    },
  ], [counts]);

  const renderHeader = () => (
    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Gestion des alertes</h1>
        <p className="text-slate-600 mt-1">
          Surveillez, priorisez et clôturez les alertes critiques directement depuis cet espace.
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={refresh}
        title="Rafraîchir"
        aria-label="Rafraîchir les alertes"
        disabled={isLoading}
        className="p-2"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );

  const types = useMemo(() => {
    const s = new Set<string>();
    alertesData.forEach((a) => {
      if (a.type) s.add(a.type);
    });
    return ["all", ...Array.from(s)];
  }, [alertesData]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("actif"); // Par défaut: alertes actives
    setFilterType("all");
    setFilterCritique("all");
  };

  const filteredAlertes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return alertesData.filter((a) => {
      const matchesSearch =
        q === "" ||
        (a.capteur?.matricule ?? "")
          .toString()
          .toLowerCase()
          .includes(q) ||
        (a.type ?? "").toLowerCase().includes(q) ||
        (a.valeur ?? "").toString().includes(q) ||
        a.id.toString().includes(q);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "actif" && isActiveStatus(a.statut)) ||
        (filterStatus === "inactif" && isInactiveStatus(a.statut));

      const matchesType = filterType === "all" || a.type === filterType;

      const isCritique = (a as any).critique === true || (a as any).critique === 1;
      const matchesCritique =
        filterCritique === "all" ||
        (filterCritique === "critique" && isCritique) ||
        (filterCritique === "non-critique" && !isCritique);

      return matchesSearch && matchesStatus && matchesType && matchesCritique;
    });
  }, [alertesData, searchTerm, filterStatus, filterType, filterCritique]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAlertes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlertes = filteredAlertes.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType, filterCritique, itemsPerPage]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  /* ---------- Display helpers (no colored badges) ---------- */
  const statutDisplay = (s: RawStatut) => {
    if (isActiveStatus(s))
      return (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 font-medium">
          Actif
        </Badge>
      );
    if (isInactiveStatus(s))
      return (
        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 font-medium">
          Résolu
        </Badge>
      );
    return (
      <Badge variant="secondary" className="font-medium">
        {s}
      </Badge>
    );
  };

  const typeDisplay = (t?: string) => {
    const text = t ?? "—";
    return (
      <span className="text-sm text-slate-700">{text}</span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8 bg-slate-50 p-6 lg:p-8">
        {renderHeader()}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              <p className="text-sm text-slate-600">Chargement des alertes...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 bg-slate-50 p-6 lg:p-8">
        {renderHeader()}
        <Card className="border border-red-200 bg-red-50/60">
          <CardContent className="flex flex-col gap-4 p-6 text-sm text-red-700">
            <span>{error}</span>
            <div>
              <Button variant="outline" onClick={refresh} size="sm">
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderHeader()}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statHighlights.map((highlight) => {
          const Icon = highlight.icon;
          return (
            <Card
              key={highlight.id}
              className="border-2 hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {highlight.label}
                  </p>
                  <p className={`text-3xl font-bold mt-2 ${highlight.valueClass}`}>{highlight.value}</p>
                </div>
                <div className={`rounded-full p-4 ${highlight.iconClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <Input
            placeholder=" Rechercher par matricule, type, valeur ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 text-base"
          />
        </CardContent>
      </Card>

      {/* Filters with FilterBar component */}
      <FilterBar
        sections={[
          {
            label: "Filtres",
            content: (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">Statut</Label>
                  <CustomSelect value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)} className="w-full">
                    <CustomSelectItem value="all">Tous les statuts</CustomSelectItem>
                    <CustomSelectItem value="actif">Actif</CustomSelectItem>
                    <CustomSelectItem value="inactif">Résolu</CustomSelectItem>
                  </CustomSelect>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">Type d'alerte</Label>
                  <CustomSelect value={filterType} onValueChange={(v: any) => setFilterType(v)} className="w-full">
                    {types.map(t => (
                      <CustomSelectItem key={t} value={t}>{t === 'all' ? 'Tous les types' : t}</CustomSelectItem>
                    ))}
                  </CustomSelect>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">Criticité</Label>
                  <CustomSelect value={filterCritique} onValueChange={(v: any) => setFilterCritique(v)} className="w-full">
                    <CustomSelectItem value="all">Toutes</CustomSelectItem>
                    <CustomSelectItem value="critique">Critiques</CustomSelectItem>
                    <CustomSelectItem value="non-critique">Normales</CustomSelectItem>
                  </CustomSelect>
                </div>
              </div>
            ),
          },
        ]}
        onReset={resetFilters}
        stats={
          <span>
            {filteredAlertes.length} alerte{filteredAlertes.length > 1 ? 's' : ''}
          </span>
        }
      />

      {/* Table */}
      <Card className="border-2">
        <CardContent className="p-0">
          <AlertesTable
            alertes={paginatedAlertes}
            formatDate={formatDate}
            statutDisplay={statutDisplay}
            typeDisplay={typeDisplay}
          />
        </CardContent>
        <div className="border-t bg-slate-50 px-6 py-4">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAlertes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemLabel="alertes"
          />
        </div>
      </Card>
    </div>
  );
}

/* ---------- Table component (no JSX typings) ---------- */
function AlertesTable(props: {
  alertes: Alerte[];
  formatDate: (s: string) => string;
  statutDisplay: (s: RawStatut) => any;
  typeDisplay: (t?: string) => any;
}) {
  const { alertes, formatDate, statutDisplay, typeDisplay } = props;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-500" />
                Capteur
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
                Type d'Alerte
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                Valeur
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-slate-500" />
                Criticité
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                Statut
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Date & Heure
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {alertes.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-32">
                <div className="flex flex-col items-center justify-center text-center gap-3">
                  <div className="rounded-full bg-slate-100 p-4">
                    <AlertTriangle className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-700">Aucune alerte trouvée</p>
                    <p className="mt-1 text-sm text-slate-500">Aucune donnée ne correspond à vos filtres</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}

          {alertes.length > 0 && alertes.map((a) => {
            const isCritique = (a as any).critique === true || (a as any).critique === 1;
            return (
              <TableRow 
                key={a.id} 
                className={`transition-colors hover:bg-slate-50 ${isCritique ? "bg-red-50/30" : ""}`}
              >
                {/* Capteur */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">
                        {a.capteur?.matricule?.substring(0, 2).toUpperCase() ?? "NA"}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {a.capteur?.matricule ?? "#" + (a.capteur_id ?? "N/A")}
                      </div>
                      <div className="text-xs text-slate-500">
                        ID: {a.capteur_id ?? "N/A"}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {typeDisplay(a.type)}
                  </div>
                </TableCell>

                {/* Valeur */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <div className="font-mono text-sm font-semibold text-slate-900">
                      {a.valeur ?? "—"}
                    </div>
                    {(a.capteur as any)?.unite && (
                      <div className="text-xs text-slate-500 font-medium">
                        {(a.capteur as any).unite}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Critique */}
                <TableCell>
                  {isCritique ? (
                    <Badge variant="destructive" className="font-medium">
                      Critique
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="font-medium">
                      Normal
                    </Badge>
                  )}
                </TableCell>

                {/* Statut */}
                <TableCell>{statutDisplay(a.statut)}</TableCell>

                {/* Date */}
                <TableCell>
                  <div className="text-sm text-slate-600 font-medium">
                    {formatDate(a.date)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

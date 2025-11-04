// src/components/alertes/alertes-management.tsx
import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  Search,
  Filter,
  WifiOff,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  RefreshCw,
  X,
  Clock,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
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
  
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "actif" | "inactif">(
    "all"
  );
  const [filterType, setFilterType] = useState<"all" | string>("all");
  const [filterCritique, setFilterCritique] = useState<"all" | "critique" | "non-critique">("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sync alertes from React Query
  useEffect(() => {
    if (alertesData) {
      setAlertes(alertesData);
    }
  }, [alertesData]);

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
    const total = alertes.length;
    const actif = alertes.filter((a) => isActiveStatus(a.statut)).length;
    const inactif = alertes.filter((a) => isInactiveStatus(a.statut)).length;
    const critiques = alertes.filter((a) => (a as any).critique === true || (a as any).critique === 1).length;
    const critiquesActives = alertes.filter((a) => 
      isActiveStatus(a.statut) && ((a as any).critique === true || (a as any).critique === 1)
    ).length;

    const deconn = alertes.filter((a) => isDeconnexion(a.type));
    const high = alertes.filter((a) => isHigh(a.type));
    const low = alertes.filter((a) => isLow(a.type));

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
  }, [alertes]);

  const lastUpdated = useMemo(() => {
    if (!alertes.length) return null;
    const timestamps = alertes
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
  }, [alertes]);

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
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Gestion des alertes</h1>
            <p className="mt-2 text-slate-600">
              Surveillez, priorisez et clôturez les alertes critiques directement depuis cet espace.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-600" />
              {counts.critiquesActives} critiques actives
            </span>
            <span className="inline-flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              {counts.actif} alertes en cours
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {counts.inactif} alertes résolues
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              Réinitialiser les filtres
            </Button>
            <Button onClick={refresh} disabled={isLoading} className="whitespace-nowrap">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
          <p className="text-xs text-slate-500 sm:text-right">
            Dernière mise à jour&nbsp;: {lastUpdated ?? "non disponible"}
          </p>
        </div>
      </div>
    </section>
  );

  const types = useMemo(() => {
    const s = new Set<string>();
    alertes.forEach((a) => {
      if (a.type) s.add(a.type);
    });
    return ["all", ...Array.from(s)];
  }, [alertes]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterType("all");
    setFilterCritique("all");
  };

  const filteredAlertes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return alertes.filter((a) => {
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
  }, [alertes, searchTerm, filterStatus, filterType, filterCritique]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAlertes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlertes = filteredAlertes.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType, filterCritique]);

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
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
          <span className="text-sm font-semibold text-amber-700">Actif</span>
        </div>
      );
    if (isInactiveStatus(s))
      return (
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Résolu</span>
        </div>
      );
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5">
        <AlertTriangle className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">{s}</span>
      </div>
    );
  };

  const typeDisplay = (t?: string) => {
    const text = t ?? "—";
    if (isDeconnexion(t))
      return (
        <span className="inline-flex items-center gap-2 text-sm">
          <WifiOff className="w-4 h-4 text-red-600" />
          <span>{text}</span>
        </span>
      );
    if (isHigh(t))
      return (
        <span className="inline-flex items-center gap-2 text-sm">
          <ArrowUp className="w-4 h-4 text-orange-600" />
          <span>{text}</span>
        </span>
      );
    if (isLow(t))
      return (
        <span className="inline-flex items-center gap-2 text-sm">
          <ArrowDown className="w-4 h-4 text-blue-600" />
          <span>{text}</span>
        </span>
      );
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-slate-600" />
        <span>{text}</span>
      </span>
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
    <div className="space-y-8 bg-slate-50 p-6 lg:p-8">
      {renderHeader()}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statHighlights.map((highlight) => {
          const Icon = highlight.icon;
          return (
            <Card
              key={highlight.id}
              className="h-full border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {highlight.label}
                    </p>
                    <p className={`text-3xl font-semibold ${highlight.valueClass}`}>{highlight.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${highlight.iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>{highlight.description}</p>
                  <p className="font-semibold text-slate-700">{highlight.trend}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {categoryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.id}
              className="h-full border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-0">
                <div className="space-y-1">
                  <CardTitle className="text-base text-slate-800">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
                <div className={`rounded-lg p-2 ${card.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="text-3xl font-semibold text-slate-900">{card.total}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Actives</p>
                    <p className="text-lg font-semibold text-amber-700">{card.actif}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Résolues</p>
                    <p className="text-lg font-semibold text-emerald-700">{card.inactif}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-2 pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                <Filter className="h-5 w-5" />
                Filtres intelligents
              </CardTitle>
              <CardDescription>
                Affinez la liste selon le statut, le type et la criticité des alertes
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
              {filteredAlertes.length} résultat{filteredAlertes.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-12 border-2 pl-12 pr-12 text-base focus:border-slate-900 focus:ring-0"
              placeholder="Rechercher par matricule, type, valeur ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                aria-label="Effacer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="h-11 min-w-[12rem] border-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <SelectValue placeholder="Statut" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    Tous les statuts
                  </div>
                </SelectItem>
                <SelectItem value="actif">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    Actif
                  </div>
                </SelectItem>
                <SelectItem value="inactif">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Inactif
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="h-11 min-w-[14rem] border-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <SelectValue placeholder="Type d'alerte" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "all" ? "Tous les types" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCritique} onValueChange={(v: any) => setFilterCritique(v)}>
              <SelectTrigger className="h-11 min-w-[14rem] border-2">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-red-600" />
                  <SelectValue placeholder="Criticité" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les alertes</SelectItem>
                <SelectItem value="critique">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-600"></span>
                    Critiques seulement
                  </div>
                </SelectItem>
                <SelectItem value="non-critique">Non critiques</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="ml-auto text-slate-600 transition-colors hover:text-slate-900"
            >
              <X className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Liste des Alertes</CardTitle>
              <CardDescription className="mt-1">
                Détails complets de toutes les alertes du système
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1.5">
              Page {currentPage} / {totalPages}
            </Badge>
          </div>
        </CardHeader>
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
          <TableRow className="bg-slate-100 text-slate-700 hover:bg-slate-100">
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                Capteur
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Type d'Alerte
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Valeur
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                Criticité
              </div>
            </TableHead>
            <TableHead className="font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
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

          {alertes.map((a) => {
            const isCritique = (a as any).critique === true || (a as any).critique === 1;
            return (
              <TableRow 
                key={a.id} 
                className={`transition-colors duration-200 ${isCritique ? "bg-red-50/80" : ""} hover:bg-slate-50`}
              >
                {/* Capteur */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                      <span className="text-xs font-bold text-blue-700">
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
                    <div 
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-100 px-3 py-1.5 text-red-700"
                    >
                      <AlertOctagon className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Critique</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Normal</span>
                    </div>
                  )}
                </TableCell>

                {/* Statut */}
                <TableCell>{statutDisplay(a.statut)}</TableCell>

                {/* Date */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div className="text-sm text-slate-600 font-medium">
                      {formatDate(a.date)}
                    </div>
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

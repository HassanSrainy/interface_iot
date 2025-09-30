// src/components/alertes/alertes-management.tsx
import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Search,
  Filter,
  WifiOff,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
} from "lucide-react";

import { getAlertes, Alerte, RawStatut } from "./alertes-api";

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
    tl.includes("low") ||
    tl.includes("bas") ||
    tl.includes("min") ||
    tl.includes("lower")
  );
};

/* ---------- Component (no JSX namespace types) ---------- */
export function AlertesManagement() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "actif" | "inactif">(
    "all"
  );
  const [filterType, setFilterType] = useState<"all" | string>("all");

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAlertes();
        if (mounted) setAlertes(data);
      } catch (err: any) {
        if (mounted) setError(err?.message ?? "Erreur réseau");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlertes();
      setAlertes(data);
    } catch (err: any) {
      setError(err?.message ?? "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  /* counts */
  const counts = useMemo(() => {
    const total = alertes.length;
    const actif = alertes.filter((a) => isActiveStatus(a.statut)).length;
    const inactif = alertes.filter((a) => isInactiveStatus(a.statut)).length;

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
      deconnexion: count(deconn),
      high: count(high),
      low: count(low),
    };
  }, [alertes]);

  const types = useMemo(() => {
    const s = new Set<string>();
    alertes.forEach((a) => {
      if (a.type) s.add(a.type);
    });
    return ["all", ...Array.from(s)];
  }, [alertes]);

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

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [alertes, searchTerm, filterStatus, filterType]);

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
        <span className="inline-flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-yellow-600" />
          <span>Actif</span>
        </span>
      );
    if (isInactiveStatus(s))
      return (
        <span className="inline-flex items-center gap-2 text-sm">
          <XCircle className="w-4 h-4 text-green-600" />
          <span>Inactif</span>
        </span>
      );
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-slate-500" />
        <span>{s}</span>
      </span>
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

  if (loading) return <p>Chargement des alertes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Header row with icon refresh */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Tableau de bord — Alertes</h1>
          <p className="text-sm text-muted-foreground">
            Vue synthétique : totaux & répartition par type
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh icon-only button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            aria-label="Rafraîchir les alertes"
            title="Rafraîchir"
            className="p-2"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* KPI grid (3 columns desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-white border rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
          <div>
            <div className="text-xs text-muted-foreground">Total alertes</div>
            <div className="text-2xl font-semibold">{counts.total}</div>
            <div className="text-xs text-muted-foreground mt-1">Historique complet</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-md bg-red-50">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            {/* mini proportion bar */}
            <div className="w-24 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${counts.total ? (counts.actif / counts.total) * 100 : 0}%`,
                  backgroundColor: "#F59E0B",
                }}
              />
            </div>
          </div>
        </div>

        {/* Actives */}
        <div className="bg-white border rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
          <div>
            <div className="text-xs text-muted-foreground">Actives</div>
            <div className="text-2xl font-semibold text-yellow-600">{counts.actif}</div>
            <div className="text-xs text-muted-foreground mt-1">À traiter</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-md bg-yellow-50">
              <CheckCircle2 className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="w-24 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${counts.total ? (counts.actif / counts.total) * 100 : 0}%`,
                  backgroundColor: "#F59E0B",
                }}
              />
            </div>
          </div>
        </div>

        {/* Inactives */}
        <div className="bg-white border rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
          <div>
            <div className="text-xs text-muted-foreground">Inactives</div>
            <div className="text-2xl font-semibold text-green-600">{counts.inactif}</div>
            <div className="text-xs text-muted-foreground mt-1">Résolues</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-md bg-green-50">
              <XCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="w-24 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${counts.total ? (counts.inactif / counts.total) * 100 : 0}%`,
                  backgroundColor: "#10B981",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-red-600" /> Déconnexions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">{counts.deconnexion.total}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Actif</span>
                  <span className="ml-2 font-medium text-yellow-600">{counts.deconnexion.actif}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Inactif</span>
                  <span className="ml-2 font-medium text-green-600">{counts.deconnexion.inactif}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Capteurs n'ayant pas communiqué depuis le timeout.
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-orange-600" /> Hors seuil — High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">{counts.high.total}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Actif</span>
                  <span className="ml-2 font-medium text-yellow-600">{counts.high.actif}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Inactif</span>
                  <span className="ml-2 font-medium text-green-600">{counts.high.inactif}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Mesures supérieures au seuil max.
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-blue-600" /> Hors seuil — Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">{counts.low.total}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Actif</span>
                  <span className="ml-2 font-medium text-yellow-600">{counts.low.actif}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Inactif</span>
                  <span className="ml-2 font-medium text-green-600">{counts.low.inactif}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Mesures inférieures au seuil min.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters row with improved search (clear button) */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
    {/* 1. Champ de Recherche */}
    <div className="flex-1 relative">
        {/* L'icône de recherche est centrée verticalement */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-10"
          placeholder="Rechercher par matricule, type, valeur, id..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
            <button
                aria-label="Effacer"
                onClick={() => setSearchTerm("")}
                // Le bouton d'effacement est centré verticalement
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100"
                title="Effacer"
            >
                <X className="w-4 h-4 text-muted-foreground" />
            </button>
        )}
    </div>

    {/* 2. Conteneur des Filtres, aligné verticalement avec items-center */}
    <div className="flex gap-2 items-center">
        {/* Filtre de Statut */}
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
            </SelectContent>
        </Select>

        {/* Filtre de Type */}
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="w-48">
                <SelectValue placeholder="Type d'alerte" />
            </SelectTrigger>
            <SelectContent>
                {types.map((t) => (
                    <SelectItem key={t} value={t}>
                        {t === "all" ? "Tous les types" : t}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
</div>

      {/* Tabs + table */}
      <Tabs defaultValue="all" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="all">Toutes ({counts.total})</TabsTrigger>
                <TabsTrigger value="actif">Actives ({counts.actif})</TabsTrigger>
                <TabsTrigger value="inactif">Inactives ({counts.inactif})</TabsTrigger>
              </TabsList>
            </div>

            <div>
              <TabsContent value="all">
                <AlertesTable alertes={filteredAlertes} formatDate={formatDate} statutDisplay={statutDisplay} typeDisplay={typeDisplay} />
              </TabsContent>

              <TabsContent value="actif">
                <AlertesTable alertes={filteredAlertes.filter(a => isActiveStatus(a.statut))} formatDate={formatDate} statutDisplay={statutDisplay} typeDisplay={typeDisplay} />
              </TabsContent>

              <TabsContent value="inactif">
                <AlertesTable alertes={filteredAlertes.filter(a => isInactiveStatus(a.statut))} formatDate={formatDate} statutDisplay={statutDisplay} typeDisplay={typeDisplay} />
              </TabsContent>
            </div>
          </CardContent>
        </Card>
      </Tabs>
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
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capteur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {alertes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Aucune alerte trouvée.
                </TableCell>
              </TableRow>
            )}

            {alertes.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.capteur?.matricule ?? "#" + (a.capteur_id ?? "N/A")}
                </TableCell>
                <TableCell>{typeDisplay(a.type)}</TableCell>
                <TableCell>{a.valeur ?? "—"}</TableCell>
                <TableCell>{statutDisplay(a.statut)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(a.date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

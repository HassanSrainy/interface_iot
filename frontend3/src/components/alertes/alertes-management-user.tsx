// src/components/alertes/alertes-management-user.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

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
import { ModernPagination } from "../ui/modern-pagination";
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

import {
  getAlertes,
  getAlertesByUser,
  Alerte,
  RawStatut,
} from "./alertes-api";

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

/* ---------- Component ---------- */
export function AlertesManagementUser(): React.ReactElement {
  const { user } = useAuth();

  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "actif" | "inactif">(
    "all"
  );
  const [filterType, setFilterType] = useState<"all" | string>("all");

  // Pagination, sort, group-by
  const [sortKey, setSortKey] = useState<"id" | "type" | "date" | "statut">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [groupBy, setGroupBy] = useState<"none" | "type" | "statut">("none");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!user) {
        // clear when no user (safety)
        if (mounted) {
          setAlertes([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Prefer user-scoped endpoint when available
        let data: Alerte[] = [];
        if ((user as any).id && typeof getAlertesByUser === "function") {
          try {
            data = await getAlertesByUser((user as any).id);
          } catch (err) {
            // fallback to generic endpoint if user-route fails
            console.warn("getAlertesByUser failed, fallback to getAlertes()", err);
            data = await getAlertes();
          }
        } else {
          data = await getAlertes();
        }

        if (mounted) setAlertes(Array.isArray(data) ? data : []);
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
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let data: Alerte[] = [];
      if ((user as any).id && typeof getAlertesByUser === "function") {
        try {
          data = await getAlertesByUser((user as any).id);
        } catch (err) {
          console.warn("getAlertesByUser refresh failed, fallback to getAlertes()", err);
          data = await getAlertes();
        }
      } else {
        data = await getAlertes();
      }
      setAlertes(Array.isArray(data) ? data : []);
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

  // Sort
  const sortedAlertes = useMemo(() => {
    const arr = [...filteredAlertes];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "id") {
        cmp = a.id - b.id;
      } else if (sortKey === "type") {
        cmp = (a.type ?? "").localeCompare(b.type ?? "");
      } else if (sortKey === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortKey === "statut") {
        cmp = (a.statut ?? "").localeCompare(b.statut ?? "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredAlertes, sortKey, sortDir]);

  // Group By
  const groupedAlertes = useMemo(() => {
    if (groupBy === "none") return {};
    const groups: Record<string, Alerte[]> = {};
    sortedAlertes.forEach((a) => {
      const key = groupBy === "type" ? (a.type || "—") : (a.statut || "—");
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return groups;
  }, [sortedAlertes, groupBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedAlertes.length / pageSize));
  const alertesPage = useMemo(() => {
    if (groupBy !== "none") return sortedAlertes;
    const start = pageIndex * pageSize;
    return sortedAlertes.slice(start, start + pageSize);
  }, [sortedAlertes, pageIndex, pageSize, groupBy]);

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

  /* ---------- Display helpers ---------- */
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

  // if not logged show hint
  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vous n'êtes pas connecté — connectez-vous pour afficher vos alertes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Tableau de bord — Alertes</h1>
          <p className="text-sm text-muted-foreground">
            Vos alertes (utilisateur)
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
          <div>
            <div className="text-xs text-muted-foreground">Total alertes</div>
            <div className="text-2xl font-semibold">{counts.total}</div>
            <div className="text-xs text-muted-foreground mt-1">Historique</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-md bg-red-50">
              <AlertTriangle className="w-6 h-6 text-red-600" />
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100"
              title="Effacer"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex gap-2 items-center">
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

          {/* Sort Key */}
          <Select value={sortKey} onValueChange={(v: any) => setSortKey(v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="statut">Statut</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Direction */}
          <Select value={sortDir} onValueChange={(v: any) => setSortDir(v)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>

          {/* Group By */}
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Grouper par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sans groupe</SelectItem>
              <SelectItem value="type">Par Type</SelectItem>
              <SelectItem value="statut">Par Statut</SelectItem>
            </SelectContent>
          </Select>

          {/* Page Size */}
          <Select value={String(pageSize)} onValueChange={(v: any) => { setPageSize(Number(v)); setPageIndex(0); }}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
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
                <AlertesTable
                  sortedAlertes={sortedAlertes}
                  groupBy={groupBy}
                  groupedAlertes={groupedAlertes}
                  alertesPage={alertesPage}
                  totalPages={totalPages}
                  pageIndex={pageIndex}
                  setPageIndex={setPageIndex}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  formatDate={formatDate}
                  statutDisplay={statutDisplay}
                  typeDisplay={typeDisplay}
                />
              </TabsContent>

              <TabsContent value="actif">
                <AlertesTable
                  sortedAlertes={sortedAlertes.filter(a => isActiveStatus(a.statut))}
                  groupBy="none"
                  groupedAlertes={{}}
                  alertesPage={sortedAlertes.filter(a => isActiveStatus(a.statut)).slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
                  totalPages={Math.max(1, Math.ceil(sortedAlertes.filter(a => isActiveStatus(a.statut)).length / pageSize))}
                  pageIndex={pageIndex}
                  setPageIndex={setPageIndex}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  formatDate={formatDate}
                  statutDisplay={statutDisplay}
                  typeDisplay={typeDisplay}
                />
              </TabsContent>

              <TabsContent value="inactif">
                <AlertesTable
                  sortedAlertes={sortedAlertes.filter(a => isInactiveStatus(a.statut))}
                  groupBy="none"
                  groupedAlertes={{}}
                  alertesPage={sortedAlertes.filter(a => isInactiveStatus(a.statut)).slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
                  totalPages={Math.max(1, Math.ceil(sortedAlertes.filter(a => isInactiveStatus(a.statut)).length / pageSize))}
                  pageIndex={pageIndex}
                  setPageIndex={setPageIndex}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  formatDate={formatDate}
                  statutDisplay={statutDisplay}
                  typeDisplay={typeDisplay}
                />
              </TabsContent>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

/* ---------- Table component ---------- */
function AlertesTable(props: {
  sortedAlertes: Alerte[];
  groupBy: "none" | "type" | "statut";
  groupedAlertes: Record<string, Alerte[]>;
  alertesPage: Alerte[];
  totalPages: number;
  pageIndex: number;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  formatDate: (s: string) => string;
  statutDisplay: (s: RawStatut) => any;
  typeDisplay: (t?: string) => any;
}) {
  const { sortedAlertes, groupBy, groupedAlertes, alertesPage, totalPages, pageIndex, setPageIndex, pageSize, setPageSize, formatDate, statutDisplay, typeDisplay } = props;

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
            {sortedAlertes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Aucune alerte trouvée.
                </TableCell>
              </TableRow>
            )}

            {groupBy !== "none"
              ? Object.entries(groupedAlertes).map(([groupName, groupAlertes]) => (
                  <React.Fragment key={groupName}>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="font-semibold text-sm uppercase tracking-wide">
                        {groupName} ({groupAlertes.length})
                      </TableCell>
                    </TableRow>
                    {groupAlertes.map((a) => (
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
                  </React.Fragment>
                ))
              : alertesPage.map((a) => (
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
                ))
            }
          </TableBody>
        </Table>

        {groupBy === "none" && (
          <ModernPagination
            currentPage={pageIndex + 1}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedAlertes.length}
            onPageChange={(page) => setPageIndex(page - 1)}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 30, 50, 100]}
            itemLabel="alertes"
            showPageSizeSelector={true}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default AlertesManagementUser;

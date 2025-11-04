import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ModernPagination } from "../ui/modern-pagination";
import { Search } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  Clinique,
  getCliniques,
  getCliniquesByUser,
  getCliniqueSummary,
} from "./cliniques-api";

export default function CliniqueManagementUser() {
  const { user, loading: authLoading } = useAuth();
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Sort & pagination
  const [sortKey, setSortKey] = useState<"nom" | "ville">("nom");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = user?.id ? await getCliniquesByUser(user.id) : await getCliniques();
        if (!mounted) return;
        setCliniques(Array.isArray(list) ? list : []);
        setPageIndex(0);
      } catch (err: any) {
        console.error("Failed to load cliniques", err);
        setError(err?.message ?? "Erreur lors du chargement des cliniques");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!authLoading) load();

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return cliniques;
    const term = searchTerm.toLowerCase();
    return cliniques.filter((c) =>
      `${c.nom} ${c.ville ?? ""} ${c.adresse ?? ""}`.toLowerCase().includes(term),
    );
  }, [cliniques, searchTerm]);

  const sortedCliniques = useMemo(() => {
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      let aVal = "", bVal = "";
      if (sortKey === "nom") {
        aVal = a.nom || "";
        bVal = b.nom || "";
      } else if (sortKey === "ville") {
        aVal = a.ville || "";
        bVal = b.ville || "";
      }
      const comparison = aVal.localeCompare(bVal);
      return sortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedCliniques.length / pageSize));
  const cliniquesPage = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedCliniques.slice(start, start + pageSize);
  }, [sortedCliniques, pageIndex, pageSize]);

  useEffect(() => {
    if (pageIndex >= totalPages && totalPages > 0) {
      setPageIndex(Math.max(0, totalPages - 1));
    }
  }, [pageIndex, totalPages]);

  if (authLoading || loading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Chargement des cliniques…</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cliniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cliniques</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search & Sort Controls */}
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, ville, adresse..."
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 whitespace-nowrap">Trier par:</span>
              <Select
                value={sortKey}
                onValueChange={(val: string) => setSortKey(val as "nom" | "ville")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nom">Nom</SelectItem>
                  <SelectItem value="ville">Ville</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 whitespace-nowrap">Ordre:</span>
              <Select
                value={sortDir}
                onValueChange={(val: string) => setSortDir(val as "asc" | "desc")}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Croissant</SelectItem>
                  <SelectItem value="desc">Décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sortedCliniques.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">
                {searchTerm ? "Aucune clinique trouvée pour cette recherche" : "Aucune clinique trouvée"}
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-3">
                {cliniquesPage.map((c) => (
                  <div key={c.id} className="mb-3">
                    <Card>
                      <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{c.nom}</div>
                            <div className="text-sm text-muted-foreground">{c.ville ?? ""}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => getCliniqueSummary(c.id).then(console.log)}>
                              Résumé
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">{c.adresse}</div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Modern Pagination */}
              <ModernPagination
                currentPage={pageIndex + 1}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={sortedCliniques.length}
                onPageChange={(page) => setPageIndex(page - 1)}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 30]}
                itemLabel="cliniques"
                showPageSizeSelector={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
 
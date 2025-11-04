// frontend3/src/components/dashboard/clinic-overview.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Building, Activity, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { CapteurWithRelations, Alerte } from "../../types/domain";
import { getServicesByClinique } from "../cliniques/cliniques-api";

/**
 * Minimal types used in this component
 */
type ServiceFromApi = {
  id: number | string;
  nom: string;
  capteurs_count?: number;
  floor_id?: number | string;
  floor_nom?: string | null;
  floor_index?: number | null;
  floor_label?: string | null;
};

export type ClinicAgg = {
  id: string;
  nom: string;
  adresse: string;
  capteurs: CapteurWithRelations[];
  capteursEnLigne: number;
  alertesActives: number;
  services?: ServiceFromApi[]; // flat list returned from backend (/cliniques/{id}/services)
  floors?: any[]; // optional fallback structure from backend
};

interface ClinicOverviewProps {
  capteurs?: CapteurWithRelations[];
  alertes?: Alerte[];
  cliniquesData?: ClinicAgg[]; // optional preloaded clinics (from parent)
}

/**
 * Helper: group services by floor_index or floor_label.
 * Returns array sorted by floor_index (if present) or original order.
 */
function groupServicesByFloor(services?: ServiceFromApi[]) {
  if (!Array.isArray(services) || services.length === 0) return [];

  const map = new Map<string, { floorLabel: string; floorIndex: number | null; services: ServiceFromApi[] }>();

  for (const s of services) {
    const idx = typeof s.floor_index === "number" ? s.floor_index : null;
    const key = idx !== null ? `i_${idx}` : String(s.floor_label ?? s.floor_nom ?? "no_floor");
    const label =
      s.floor_label ??
      s.floor_nom ??
      (idx === 0 ? "Rez-de-chaussée" : idx !== null ? `${idx}ème étage` : "Étage inconnu");
    if (!map.has(key)) map.set(key, { floorLabel: label, floorIndex: idx, services: [] });
    map.get(key)!.services.push(s);
  }

  const arr = Array.from(map.values());
  arr.sort((a, b) => {
    if (a.floorIndex == null && b.floorIndex == null) return a.floorLabel.localeCompare(b.floorLabel);
    if (a.floorIndex == null) return 1;
    if (b.floorIndex == null) return -1;
    return (a.floorIndex as number) - (b.floorIndex as number);
  });

  return arr;
}

export function ClinicOverview({ capteurs = [], alertes = [], cliniquesData }: ClinicOverviewProps) {
  // fallback minimal clinic build from capteurs if cliniquesData not provided
  const cliniquesComputed: ClinicAgg[] = useMemo(() => {
    if (!capteurs || capteurs.length === 0) return [];
    const map: Record<string, ClinicAgg> = {};
    for (const cap of capteurs) {
      const clinicRawId = (cap as any)?.service?.floor?.clinique?.id;
      const clinicId = clinicRawId != null ? String(clinicRawId) : `__unknown_${cap.id}`;
      const name = (cap as any)?.service?.floor?.clinique?.nom ?? "Clinique inconnue";
      const addr = (cap as any)?.service?.floor?.clinique?.adresse ?? "";
      if (!map[clinicId]) {
        map[clinicId] = { id: clinicId, nom: name, adresse: addr, capteurs: [], capteursEnLigne: 0, alertesActives: 0 };
      }
      map[clinicId].capteurs.push(cap);
      if ((cap as any)?.status === "online") map[clinicId].capteursEnLigne++;
    }
    return Object.values(map);
  }, [capteurs]);

  // baseClinics: prefer passed cliniquesData else computed from capteurs
  const baseClinics = cliniquesData && cliniquesData.length > 0 ? cliniquesData : cliniquesComputed;

  const isAlerteActive = (a: any) => {
    const s = String((a?.statut ?? a?.status ?? "")).toLowerCase();
    return s === "active" || s === "actif";
  };

  // compute counts per clinic (alerts)
  const countsByClinic = useMemo(() => {
    const map = new Map<string, number>();
    if (!alertes || alertes.length === 0 || baseClinics.length === 0) return map;
    
    // Build comprehensive capToClinic mapping from all available capteurs
    const capToClinic = new Map<string | number, string>();
    
    // First, map from baseClinics capteurs
    for (const c of baseClinics) {
      for (const cp of c.capteurs) {
        const capId = (cp as any).id;
        if (capId != null) {
          capToClinic.set(capId, c.id);
          capToClinic.set(String(capId), c.id); // Also add string version
        }
      }
    }

    // Count active alerts per clinic
    for (const a of alertes) {
      if (!isAlerteActive(a)) continue;
      
      // Try multiple ways to get capteur reference
      const capRef = (a as any).capteur ?? (a as any).capteur_id ?? null;
      const capId = typeof capRef === "object" ? capRef?.id : capRef;
      
      if (capId == null) continue;
      
      // Try both number and string versions
      let clinicId = capToClinic.get(capId) ?? capToClinic.get(String(capId)) ?? null;
      
      // If not found in map but capteur object exists with nested clinic data
      if (!clinicId && typeof capRef === "object" && capRef) {
        const nestedClinicId = capRef?.service?.floor?.clinique?.id ?? 
                              capRef?.service?.floor?.clinique_id ??
                              capRef?.clinique?.id ??
                              capRef?.clinique_id;
        if (nestedClinicId != null) {
          clinicId = String(nestedClinicId);
        }
      }
      
      if (clinicId) {
        map.set(String(clinicId), (map.get(String(clinicId)) ?? 0) + 1);
      }
    }
    return map;
  }, [alertes, baseClinics]);

  // Merge counts into clinic objects
  const cliniquesWithCounts = useMemo(
    () =>
      baseClinics.map((c) => ({
        ...c,
        alertesActives: countsByClinic.get(String(c.id)) ?? c.alertesActives ?? 0,
      })),
    [baseClinics, countsByClinic]
  );

  // Local state that will contain clinics + services (we'll fetch missing services)
  // IMPORTANT: we will ALWAYS reconcile clinicsWithServices with cliniquesWithCounts:
  //   - add new clinics
  //   - update counts/metadata for existing clinics
  //   - remove deleted clinics
  // while preserving any previously-loaded `services` arrays to avoid flicker.
  const [clinicsWithServices, setClinicsWithServices] = useState<ClinicAgg[]>(cliniquesWithCounts);

  // loading flag for manual refresh of services
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reconcile local clinics list with the incoming cliniquesWithCounts whenever it changes.
  // Preserve existing services for clinics when possible to avoid UI flicker.
  useEffect(() => {
    setClinicsWithServices((prev) => {
      // Build a map of existing services by clinic id
      const svcMap = new Map<string, ServiceFromApi[] | undefined>();
      for (const p of prev) svcMap.set(String(p.id), p.services);

      // Rebuild array from cliniquesWithCounts but attach preserved services if present
      const next = cliniquesWithCounts.map((c) => ({
        ...c,
        services: svcMap.get(String(c.id)) ?? c.services,
      }));

      return next;
    });

    // Fetch missing services for clinics that don't have them yet (but don't wipe existing ones)
    const toFetch = cliniquesWithCounts.filter((c) => !Array.isArray(c.services) || c.services.length === 0);

    if (toFetch.length === 0) return;

    let mounted = true;
    (async () => {
      try {
        const promises = toFetch.map(async (c) => {
          try {
            const services = await getServicesByClinique(Number(c.id));
            return { id: String(c.id), services: services as ServiceFromApi[] };
          } catch {
            return { id: String(c.id), services: [] as ServiceFromApi[] };
          }
        });

        const results = await Promise.all(promises);

        if (!mounted) return;

        setClinicsWithServices((prev) =>
          prev.map((p) => {
            const found = results.find((r) => String(r.id) === String(p.id));
            if (!found) return p;
            // Only set services if previously missing or empty (prevent overwriting user-loaded services)
            if (!p.services || p.services.length === 0) {
              return { ...p, services: found.services };
            }
            return p;
          })
        );
      } catch (e) {
        // ignore for now (could log)
        // console.error("Failed to fetch services", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [cliniquesWithCounts]);

  const cliniques = clinicsWithServices; // rename for render

  const totalActiveAlerts = (alertes || []).filter(isAlerteActive).length;

  // Precompute groups for each clinic (safe: useMemo once for all clinics)
  const clinicGroups = useMemo(() => {
    return cliniques.map((clinique) => {
      // Prefer backend-provided flat services array if present (from /cliniques/{id}/services)
      if (Array.isArray(clinique.services) && clinique.services.length > 0) {
        return { clinic: clinique, groups: groupServicesByFloor(clinique.services as ServiceFromApi[]) };
      }

      // fallback: if floors with services exist, build groups simply
      if (Array.isArray(clinique.floors) && clinique.floors.length > 0) {
        const g = (clinique.floors as any[]).map((f, idx) => ({
          floorLabel: f.nom ?? (idx === 0 ? "Rez-de-chaussée" : `${idx}ème étage`),
          floorIndex: typeof f.niveau === "number" ? f.niveau : idx,
          services: Array.isArray(f.services)
            ? f.services.map((s: any) => ({
                id: s.id,
                nom: s.nom,
                capteurs_count: s.capteurs ? s.capteurs.length : s.capteurs_count ?? 0,
                floor_index: typeof f.niveau === "number" ? f.niveau : idx,
                floor_label: f.nom ?? (idx === 0 ? "Rez-de-chaussée" : `${idx}ème étage`),
              }))
            : [],
        })).filter((x) => x.services.length > 0);
        return { clinic: clinique, groups: g };
      }

      // last fallback: derive from capteurs (aggregate count)
      const map: Record<string, { floorLabel: string; floorIndex: number | null; services: ServiceFromApi[] }> = {};
      for (const cap of clinique.capteurs || []) {
        const svc = (cap as any)?.service;
        if (!svc) continue;
        const fid = svc.floor?.id ?? svc.floor_id ?? null;
        const idx = typeof fid === "number" ? fid : null;
        const label = svc.floor?.nom ?? (idx === 0 ? "Rez-de-chaussée" : idx !== null ? `${idx}ème étage` : "Étage inconnu");
        const key = idx !== null ? `i_${idx}` : label;
        if (!map[key]) map[key] = { floorLabel: label, floorIndex: idx, services: [] };
        const sid = svc.id ?? svc.nom ?? JSON.stringify(svc);
        let existing = map[key].services.find((s) => String(s.id) === String(sid));
        if (existing) existing.capteurs_count = (existing.capteurs_count ?? 0) + 1;
        else map[key].services.push({ id: sid, nom: svc.nom ?? svc.name ?? "Service", capteurs_count: 1, floor_index: idx, floor_label: label });
      }
      return { clinic: clinique, groups: Object.values(map) };
    });
  }, [cliniques]);

  // Manual refresh: re-fetch services for all clinics (overwrites only if fetch returns)
  const refreshServices = async () => {
    setIsRefreshing(true);
    try {
      const promises = cliniques.map(async (c) => {
        try {
          const services = await getServicesByClinique(Number(c.id));
          return { id: String(c.id), services: services as ServiceFromApi[] };
        } catch {
          return { id: String(c.id), services: c.services ?? [] as ServiceFromApi[] };
        }
      });

      const results = await Promise.all(promises);

      setClinicsWithServices((prev) =>
        prev.map((p) => {
          const found = results.find((r) => String(r.id) === String(p.id));
          if (!found) return p;
          return { ...p, services: found.services };
        })
      );
    } catch (e) {
      console.error("Erreur lors du refresh des services", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ---------- Rendu ----------
  return (
    <div className="space-y-6">
      {/* top bar with Refresh button */}
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshServices}
          title="Rafraîchir"
          aria-label="Rafraîchir les services des cliniques"
          disabled={isRefreshing}
          className="p-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* TOP SUMMARY */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cliniques</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cliniques.length}</div>
            <p className="text-xs text-muted-foreground">Actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Capteurs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cliniques.reduce((s, c) => s + (c.capteurs?.length ?? 0), 0)}</div>
            <p className="text-xs text-muted-foreground">{cliniques.reduce((s, c) => s + (c.capteursEnLigne ?? 0), 0)} en ligne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-medium">Alertes actives</CardTitle>
              <Badge variant="destructive" className="text-xs">{totalActiveAlerts}</Badge>
            </div>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalActiveAlerts}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>
      </div>

      {/* PER-CLINIC CARDS */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Vue par Clinique</h3>
        <div className="grid gap-6 md:grid-cols-2">
          {clinicGroups.map(({ clinic, groups }, idx) => (
            <Card key={String(clinic.id)} className="overflow-hidden border-2 hover:shadow-lg transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">{clinic.nom}</CardTitle>
                        <p className="text-sm text-slate-600 mt-0.5">{clinic.adresse}</p>
                      </div>
                    </div>
                  </div>
                  {clinic.alertesActives > 0 && (
                    <Badge variant="destructive" className="text-base px-3 py-1.5 shadow-sm">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {clinic.alertesActives}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Capteurs</p>
                    </div>
                    <div className="text-3xl font-bold text-blue-700">{clinic.capteurs.length}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">En ligne</p>
                    </div>
                    <div className="text-3xl font-bold text-green-700">{clinic.capteursEnLigne}</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">Alertes</p>
                    </div>
                    <div className="text-3xl font-bold text-red-700">{clinic.alertesActives}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClinicOverview;

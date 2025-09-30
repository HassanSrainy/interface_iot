// frontend3/src/components/dashboard/clinic-overview.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Building, Activity, AlertTriangle } from "lucide-react";
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
  // autorise number ou null (ou undefined via le ?)
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
    const label = s.floor_label ?? s.floor_nom ?? (idx === 0 ? "Rez-de-chaussée" : idx !== null ? `${idx}ème étage` : "Étage inconnu");
    if (!map.has(key)) map.set(key, { floorLabel: label, floorIndex: idx, services: [] });
    map.get(key)!.services.push(s);
  }

  const arr = Array.from(map.values());
  // sort: numeric floorIndex first by index, then others alphabetically by label
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
    const capToClinic = new Map<string | number, string>();
    for (const c of baseClinics) for (const cp of c.capteurs) capToClinic.set((cp as any).id, c.id);

    for (const a of alertes) {
      if (!isAlerteActive(a)) continue;
      const capRef = (a as any).capteur ?? (a as any).capteur_id ?? null;
      const capId = typeof capRef === "object" ? capRef?.id : capRef;
      const clinicId = capId != null ? capToClinic.get(capId) ?? null : null;
      if (clinicId) map.set(clinicId, (map.get(clinicId) ?? 0) + 1);
    }
    return map;
  }, [alertes, baseClinics]);

  // Merge counts into clinic objects
  const cliniquesWithCounts = useMemo(
    () => baseClinics.map(c => ({ ...c, alertesActives: countsByClinic.get(String(c.id)) ?? c.alertesActives ?? 0 })),
    [baseClinics, countsByClinic]
  );

  // Local state that will contain clinics + services (we'll fetch missing services)
  const [clinicsWithServices, setClinicsWithServices] = useState<ClinicAgg[]>(cliniquesWithCounts);

  // When base clinics change, reset local state and fetch missing services
  useEffect(() => {
    let mounted = true;
    setClinicsWithServices(cliniquesWithCounts);

    // Identify clinics that need services to be fetched (no services array present)
    const toFetch = cliniquesWithCounts.filter(c => !Array.isArray(c.services) || c.services.length === 0);

    if (toFetch.length === 0) return () => { mounted = false; };

    // Fetch in parallel
    (async () => {
      try {
        const promises = toFetch.map(async (c) => {
          const services = await getServicesByClinique(Number(c.id)); // API returns flat list
          return { id: String(c.id), services };
        });

        const results = await Promise.all(promises);

        if (!mounted) return;

        setClinicsWithServices(prev =>
          prev.map(p => {
            const found = results.find(r => String(r.id) === String(p.id));
            if (!found) return p;
            return { ...p, services: found.services as ServiceFromApi[] };
          })
        );
      } catch (e) {
        // ignore fetch errors for now (could add toast/log)
        // console.error('Failed to fetch services for clinics', e);
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
          services: Array.isArray(f.services) ? f.services.map((s: any) => ({
            id: s.id,
            nom: s.nom,
            capteurs_count: s.capteurs ? s.capteurs.length : (s.capteurs_count ?? 0),
            floor_index: typeof f.niveau === "number" ? f.niveau : idx,
            floor_label: f.nom ?? (idx === 0 ? "Rez-de-chaussée" : `${idx}ème étage`),
          })) : []
        })).filter(x => x.services.length > 0);
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
        let existing = map[key].services.find(s => String(s.id) === String(sid));
        if (existing) existing.capteurs_count = (existing.capteurs_count ?? 0) + 1;
        else map[key].services.push({ id: sid, nom: svc.nom ?? svc.name ?? "Service", capteurs_count: 1, floor_index: idx, floor_label: label });
      }
      return { clinic: clinique, groups: Object.values(map) };
    });
  }, [cliniques]);

  // ---------- Rendu ----------
  return (
    <div className="space-y-6">
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
        <div className="grid gap-4 md:grid-cols-2">
          {clinicGroups.map(({ clinic, groups }, idx) => (
            <Card key={String(clinic.id)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{clinic.nom}</CardTitle>
                    <p className="text-xs text-muted-foreground">{clinic.adresse}</p>
                  </div>
                  {clinic.alertesActives > 0 && (
                    <Badge variant="destructive" className="text-sm">{clinic.alertesActives} alert{clinic.alertesActives > 1 ? "es" : ""}</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center mb-3">
                  <div>
                    <div className="text-2xl font-bold">{clinic.capteurs.length}</div>
                    <p className="text-xs text-muted-foreground">Capteurs</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{clinic.capteursEnLigne}</div>
                    <p className="text-xs text-muted-foreground">En ligne</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{clinic.alertesActives}</div>
                    <p className="text-xs text-muted-foreground">Alertes</p>
                  </div>
                </div>

                {/* Floors & services simplified */}
                <div className="space-y-3">
                  {groups.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Aucun service trouvé</div>
                  ) : (
                    groups.map((g, gi) => (
                      <div key={`${String(clinic.id)}-floor-${gi}`}>
                        <div className="text-sm font-medium mb-1">{g.floorLabel}</div>
                        <div className="flex flex-wrap gap-2">
                          {g.services.map((s: any) => (
                            <div
                              key={`${String(clinic.id)}-svc-${String(s.id)}`}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm"
                            >
                              <span className="truncate max-w-[10rem]">{s.nom}</span>
                              <span className="text-xs text-muted-foreground">• {s.capteurs_count ?? 0}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
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

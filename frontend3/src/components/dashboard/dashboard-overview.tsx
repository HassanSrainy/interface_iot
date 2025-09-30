// frontend3/src/components/dashboard/dashboard-overview.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SensorCard, { Sensor } from "./sensor-card";
import { AlertsPanel } from "./alerts-panel";
import ClinicOverview from "./clinic-overview";
import { getSensors, getSensorAlertCount } from "../sensors/sensor-api";
import * as cliniquesApi from "../cliniques/cliniques-api"; // garde ce chemin si ton fichier est cliniques-clients (ajuste si nécessaire)
import { getAlertes } from "../alertes/alertes-api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

interface DashboardOverviewProps {
  sensors?: Sensor[];
  alertes?: any[]; // si fourni par parent, on l'utilise, sinon on fetch local
  onResolveAlert?: (alerteId: string) => void;
  onIgnoreAlert?: (alerteId: string) => void;
  onShowSensorEvolution?: (sensorId: string | number) => void;
}

type PeriodOption = "1h" | "24h" | "7d" | "30d";

export function DashboardOverview({
  sensors: propsSensors = [],
  alertes: propsAlertes = [],
  onResolveAlert,
  onIgnoreAlert,
  onShowSensorEvolution,
}: DashboardOverviewProps) {
  const [sensors, setSensors] = useState<Sensor[]>(Array.isArray(propsSensors) ? propsSensors : []);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [chartPeriod, setChartPeriod] = useState<PeriodOption>("1h");
  const [alertesTotalsMap, setAlertesTotalsMap] = useState<Record<number, number>>({});
  const [alertesActiveMap, setAlertesActiveMap] = useState<Record<number, number>>({});
  const [loadingSensors, setLoadingSensors] = useState<boolean>(false);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);

  const [clinicsLoading, setClinicsLoading] = useState<boolean>(false);
  const [clinicsData, setClinicsData] = useState<any[]>([]);

  // --- NOUVEAU: états pour alertes ---
  const [fetchedAlertes, setFetchedAlertes] = useState<any[]>(Array.isArray(propsAlertes) ? propsAlertes : []);
  const [loadingAlertes, setLoadingAlertes] = useState<boolean>(false);
  const [alertesError, setAlertesError] = useState<string | null>(null);

  // détection robuste si les capteurs contiennent la hiérarchie complète
  const isFullCapteurs = sensors.length > 0 && !!(sensors[0] as any)?.service?.floor?.clinique;

  // Si le parent fournit alertes (propsAlertes non vide), on les utilise.
  // Sinon on utilise fetchedAlertes (chargées depuis getAlertes).
  const alertes = propsAlertes && propsAlertes.length > 0 ? propsAlertes : fetchedAlertes;

  // helper pour statut actif (inspiré de alertes-management)
  const isAlerteActive = (s: any) => {
    const statut = String((s?.statut ?? s?.status ?? "")).toLowerCase();
    return statut === "active" || statut === "actif";
  };

  // fetch sensors (comme avant)
  const loadAll = useCallback(async () => {
    try {
      if (!propsSensors || propsSensors.length === 0) {
        setLoadingSensors(true);
        const s = await getSensors();
        const normalizedSensors = (s || []).map(sensor => ({
          ...sensor,
          status: sensor.status === null ? undefined : sensor.status,
        }));
        setSensors(normalizedSensors);
        setLoadingSensors(false);
      } else {
        setSensors(propsSensors);
      }
    } catch (err) {
      console.error("Erreur loadAll:", err);
      setLoadingSensors(false);
    }
  }, [propsSensors]);

  useEffect(() => { loadAll(); }, [loadAll]);

  /**
   * loadClinicsHierarchy
   * - récupère la structure clinique via cliniquesApi.getCliniques()
   * - pour CHAQUE clinique appelle cliniquesApi.getCliniqueSummary(id) (optionnel)
   * - pour CHAQUE clinique appelle cliniquesApi.getServicesByClinique(id) pour récupérer services avec capteurs_count
   * - merge les compteurs summary.active_alertes & summary.total_alertes dans clinicsData
   */
  const loadClinicsHierarchy = useCallback(async () => {
    setClinicsLoading(true);
    try {
      // Si getCliniques est typé correctement, tu peux supprimer les cast "any"
      const raw: any = await (cliniquesApi as any).getCliniques();
      const cliniques = Array.isArray(raw) ? raw : (raw as any)?.data ?? [];

      const clinicsArr = await Promise.all(cliniques.map(async (clinique: any) => {
        // capteurs depuis la hiérarchie (si fournie par /cliniques)
        const capteursFromHierarchy = (clinique.floors || []).flatMap((floor: any) =>
          (floor.services || []).flatMap((service: any) => service.capteurs || [])
        );

        const capteursEnLigne = capteursFromHierarchy.filter((c: any) => String(c?.status || "").toLowerCase() === "online").length;

        // appel summary par clinique (GET /cliniques/{id}/summary) - optionnel
        let summary: any = null;
        try {
          if (typeof (cliniquesApi as any).getCliniqueSummary === "function") {
            summary = await (cliniquesApi as any).getCliniqueSummary(clinique.id);
          }
        } catch (err) {
          console.warn(`Erreur getCliniqueSummary pour clinique ${clinique.id}:`, err);
          summary = null;
        }

        // NOUVEAU: récupérer services via GET /cliniques/{id}/services
        let services: any[] = [];
        try {
          if (typeof (cliniquesApi as any).getServicesByClinique === "function") {
            services = await (cliniquesApi as any).getServicesByClinique(clinique.id);
            if (!Array.isArray(services)) services = [];
          } else {
            console.warn("getServicesByClinique not found in cliniquesApi");
          }
        } catch (err) {
          console.warn(`Erreur getServicesByClinique pour clinique ${clinique.id}:`, err);
          services = [];
        }

        return {
          id: String(clinique.id),
          nom: clinique.nom ?? `Clinique ${clinique.id}`,
          adresse: clinique.adresse ?? "",
          floors: clinique.floors ?? [],
          capteurs: capteursFromHierarchy,
          capteursEnLigne,
          services,
          alertesActives: Number(summary?.active_alertes ?? 0),
          totalAlertes: Number(summary?.total_alertes ?? 0)
        };
      }));

      setClinicsData(clinicsArr);
    } catch (err) {
      console.error("Erreur loadClinicsHierarchy:", err);
      setClinicsData([]);
    } finally {
      setClinicsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFullCapteurs) loadClinicsHierarchy();
  }, [isFullCapteurs, loadClinicsHierarchy]);

  // fetch alertes (s'inspire de alertes-management)
  const fetchAlertes = useCallback(async () => {
    let mounted = true;
    try {
      setLoadingAlertes(true);
      setAlertesError(null);
      const data = await getAlertes();
      if (mounted) setFetchedAlertes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erreur getAlertes:", err);
      if (mounted) setAlertesError(err?.message ?? "Erreur réseau");
    } finally {
      if (mounted) setLoadingAlertes(false);
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // si parent n'a pas fourni d'alertes, on va les fetcher
    if (!propsAlertes || propsAlertes.length === 0) {
      fetchAlertes();
    } else {
      // si propsAlertes fourni, synchroniser fetchedAlertes quand même pour usage interne
      setFetchedAlertes(propsAlertes);
    }
  }, [propsAlertes, fetchAlertes]);

  // expose refresh pour réactualiser les alertes (optionnel)
  const refreshAlertes = async () => {
    try {
      setLoadingAlertes(true);
      setAlertesError(null);
      const data = await getAlertes();
      setFetchedAlertes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erreur refreshAlertes:", err);
      setAlertesError(err?.message ?? "Erreur réseau");
    } finally {
      setLoadingAlertes(false);
    }
  };

  // fetch alert counts per sensor (comme avant)
  useEffect(() => {
    if (!sensors || sensors.length === 0) return;

    const fetchCountsForAll = async () => {
      setLoadingCounts(true);
      try {
        const results = await Promise.all(
          sensors.map(async (s) => {
            try {
              const res = await getSensorAlertCount(Number(s.id));
              return { id: Number(s.id), ok: true, payload: res };
            } catch (err) {
              console.error(`Erreur getSensorAlertCount(${s.id}):`, err);
              return { id: Number(s.id), ok: false, payload: null };
            }
          })
        );

        const totals: Record<number, number> = {};
        const actives: Record<number, number> = {};
        for (const r of results) {
          if (r.ok && r.payload) {
            totals[r.id] = Number(r.payload.total_alertes ?? 0);
            actives[r.id] = Number(r.payload.active_alertes ?? 0);
          } else {
            totals[r.id] = 0;
            actives[r.id] = 0;
          }
        }

        setAlertesTotalsMap(prev => ({ ...prev, ...totals }));
        setAlertesActiveMap(prev => ({ ...prev, ...actives }));
      } catch (err) {
        console.error("Erreur fetchCountsForAll:", err);
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchCountsForAll();
  }, [sensors]);

  // version compacte de filterMeasuresByPeriod (sans customRange)
  const filterMeasuresByPeriod = (sensor: Sensor | null | undefined) => {
    if (!sensor?.mesures || sensor.mesures.length === 0) return [];
    const now = new Date();
    let startDate: Date;
    switch (chartPeriod) {
      case "1h": startDate = new Date(now.getTime() - 60 * 60 * 1000); break;
      case "24h": startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case "7d": startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case "30d": startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    const endDate = now;
    return sensor.mesures
      .filter(m => {
        const date = new Date(m.date_mesure);
        return date >= startDate && date <= endDate;
      })
      .map(m => ({
        date: m.date_mesure ? new Date(m.date_mesure).toLocaleString() : String(m.id ?? ""),
        value: typeof m.valeur === "number" ? m.valeur : Number(m.valeur || 0),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // priorité : utiliser clinicsData si présent (fix race condition déjà gérée)
  const shouldUseClinicsData = clinicsData && clinicsData.length > 0;

  // calculer nombre total d'alertes actives (statut=actif)
  const totalActiveAlerts = (alertes || []).filter(isAlerteActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Vue d'ensemble</h2>
        <p className="text-muted-foreground">Aperçu de vos capteurs IoT et données en temps réel</p>
      </div>

      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evolution">Évolution/Capteur</TabsTrigger>
          <TabsTrigger value="clinics">Cliniques</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution">
          {selectedSensor ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setSelectedSensor(null)} className="text-sm underline">← Retour aux cartes</button>
                <div className="flex space-x-2">
                  <button onClick={() => setChartPeriod("1h")} className="btn">1h</button>
                  <button onClick={() => setChartPeriod("24h")} className="btn">24h</button>
                  <button onClick={() => setChartPeriod("7d")} className="btn">7j</button>
                  <button onClick={() => setChartPeriod("30d")} className="btn">30j</button>
                </div>
              </div>

              {/* SensorChart */}
              <div>
                <h4 className="text-lg font-semibold">Graphique — {selectedSensor?.matricule ?? `#${selectedSensor?.id}`}</h4>
                <div className="mt-2">
                  {filterMeasuresByPeriod(selectedSensor).length === 0 ? (
                    <div className="text-muted-foreground">Aucune mesure disponible pour ce capteur.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={filterMeasuresByPeriod(selectedSensor)} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        {selectedSensor?.seuil_max != null && <ReferenceLine y={selectedSensor.seuil_max} stroke="red" strokeDasharray="4 4" label="Seuil max" />}
                        {selectedSensor?.seuil_min != null && <ReferenceLine y={selectedSensor.seuil_min} stroke="green" strokeDasharray="4 4" label="Seuil min" />}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {!loadingSensors && sensors.length === 0 && <div className="text-muted-foreground">Aucun capteur trouvé.</div>}

              {sensors.map(sensor => (
                <SensorCard
                  key={String(sensor.id)}
                  sensor={sensor}
                  showFullHierarchy={isFullCapteurs}
                  alertesCount={alertesActiveMap[Number(sensor.id)] ?? 0}
                  totalAlertes={alertesTotalsMap[Number(sensor.id)] ?? 0}
                  showEvolution
                  onShowChart={id => {
                    const s = sensors.find(x => String(x.id) === String(id)) || sensor;
                    setSelectedSensor(s as Sensor);
                    onShowSensorEvolution?.(id);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clinics">
          {clinicsLoading && !(clinicsData && clinicsData.length > 0) ? (
            <div className="text-center py-8 text-muted-foreground">Chargement des cliniques...</div>
          ) : (clinicsData && clinicsData.length > 0) ? (
            <ClinicOverview cliniquesData={clinicsData} alertes={alertes} />
          ) : isFullCapteurs ? (
            <ClinicOverview capteurs={sensors as any} alertes={alertes} />
          ) : (
            <div className="text-muted-foreground">Aucune donnée clinique disponible.</div>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          {/* AlertsPanel reçoit maintenant les alertes (fetchées ici si props absentes) */}
          <AlertsPanel alertes={alertes} onResolveAlert={onResolveAlert} onIgnoreAlert={onIgnoreAlert} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DashboardOverview;

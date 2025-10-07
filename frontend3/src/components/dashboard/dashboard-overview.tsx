// frontend3/src/components/dashboard/dashboard-overview.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SensorCard, { Sensor } from "./sensor-card";
import { AlertsPanel } from "./alerts-panel";
import ClinicOverview from "./clinic-overview";
import { getSensors, getSensorAlertCount } from "../sensors/sensor-api";
import * as cliniquesApi from "../cliniques/cliniques-api";
import { getAlertes } from "../alertes/alertes-api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
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

interface DashboardOverviewProps {
  sensors?: Sensor[];
  alertes?: any[];
  onResolveAlert?: (alerteId: string) => void;
  onIgnoreAlert?: (alerteId: string) => void;
  onShowSensorEvolution?: (sensorId: string | number) => void;
}

type PeriodOption = "1h" | "24h" | "7d" | "30d" | "custom";

/* util : timestamp début/fin d'une date YYYY-MM-DD */
const startOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T00:00:00`).getTime();
const endOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T23:59:59.999`).getTime();

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

  // custom date range (YYYY-MM-DD)
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  // maps for alert counts per sensor
  const [alertesTotalsMap, setAlertesTotalsMap] = useState<Record<number, number>>({});
  const [alertesActiveMap, setAlertesActiveMap] = useState<Record<number, number>>({});

  // loading states
  const [loadingSensors, setLoadingSensors] = useState<boolean>(false);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);

  // clinics data
  const [clinicsLoading, setClinicsLoading] = useState<boolean>(false);
  const [clinicsData, setClinicsData] = useState<any[]>([]);

  // global alertes (panel)
  const [fetchedAlertes, setFetchedAlertes] = useState<any[]>(Array.isArray(propsAlertes) ? propsAlertes : []);
  const [loadingAlertes, setLoadingAlertes] = useState<boolean>(false);
  const [alertesError, setAlertesError] = useState<string | null>(null);

  const isFullCapteurs = sensors.length > 0 && !!(sensors[0] as any)?.service?.floor?.clinique;
  const alertes = propsAlertes && propsAlertes.length > 0 ? propsAlertes : fetchedAlertes;

  const isAlerteActive = (s: any) => {
    const statut = String((s?.statut ?? s?.status ?? "")).toLowerCase();
    return statut === "active" || statut === "actif";
  };

  /**
   * loadAll: récupère les capteurs ET les comptes d'alertes
   * - on garde loadingSensors = true jusqu'à ce que capteurs + comptes soient prêts
   * - évite le double rendu (chargement puis disparition)
   */
  const loadAll = useCallback(async () => {
    setLoadingSensors(true);
    try {
      // 1) récupérer capteurs (ou utiliser propsSensors si fournis)
      const rawSensors = (propsSensors && propsSensors.length > 0) ? propsSensors : await getSensors();
      const normalizedSensors = (rawSensors || []).map((sensor: any) => ({
        ...sensor,
        status: sensor.status === null ? undefined : sensor.status,
      }));
      setSensors(normalizedSensors);

      // 2) récupérer les comptes d'alertes pour chaque capteur (en parallèle)
      setLoadingCounts(true);
      try {
        const results = await Promise.all(
          normalizedSensors.map(async (s: any) => {
            try {
              const payload = await getSensorAlertCount(Number(s.id));
              return {
                id: Number(s.id),
                total: Number(payload?.total_alertes ?? 0),
                active: Number(payload?.active_alertes ?? 0),
              };
            } catch (err) {
              console.error(`Erreur getSensorAlertCount(${s.id}):`, err);
              return { id: Number(s.id), total: 0, active: 0 };
            }
          })
        );

        const totals: Record<number, number> = {};
        const actives: Record<number, number> = {};
        for (const r of results) {
          totals[r.id] = r.total;
          actives[r.id] = r.active;
        }
        setAlertesTotalsMap(prev => ({ ...prev, ...totals }));
        setAlertesActiveMap(prev => ({ ...prev, ...actives }));
      } finally {
        setLoadingCounts(false);
      }
    } catch (err) {
      console.error("Erreur loadAll:", err);
    } finally {
      setLoadingSensors(false);
    }
  }, [propsSensors]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /**
   * loadClinicsHierarchy: inchangée (récupère hiérarchie cliniques / services)
   */
  const loadClinicsHierarchy = useCallback(async () => {
    setClinicsLoading(true);
    try {
      const raw: any = await (cliniquesApi as any).getCliniques();
      const cliniques = Array.isArray(raw) ? raw : (raw as any)?.data ?? [];

      const clinicsArr = await Promise.all(cliniques.map(async (clinique: any) => {
        const capteursFromHierarchy = (clinique.floors || []).flatMap((floor: any) =>
          (floor.services || []).flatMap((service: any) => service.capteurs || [])
        );

        const capteursEnLigne = capteursFromHierarchy.filter((c: any) => String(c?.status || "").toLowerCase() === "online").length;

        let summary: any = null;
        try {
          if (typeof (cliniquesApi as any).getCliniqueSummary === "function") {
            summary = await (cliniquesApi as any).getCliniqueSummary(clinique.id);
          }
        } catch (err) {
          console.warn(`Erreur getCliniqueSummary pour clinique ${clinique.id}:`, err);
          summary = null;
        }

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

  /**
   * fetchAlertes (panel global) - inchangé
   */
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
    if (!propsAlertes || propsAlertes.length === 0) {
      fetchAlertes();
    } else {
      setFetchedAlertes(propsAlertes);
    }
  }, [propsAlertes, fetchAlertes]);

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

  /**
   * filterMeasuresByPeriod - extended with custom date range support
   */
  const filterMeasuresByPeriod = (sensor: Sensor | null | undefined) => {
    if (!sensor?.mesures || sensor.mesures.length === 0) return [];
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    switch (chartPeriod) {
      case "1h":
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (dateFrom && dateTo) {
          startDate = new Date(startOfDayTs(dateFrom));
          endDate = new Date(endOfDayTs(dateTo));
          if (startDate > endDate) {
            // swap if inverted
            const tmp = startDate;
            startDate = endDate;
            endDate = tmp;
          }
        } else {
          // no custom range selected => return empty
          return [];
        }
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return sensor.mesures
      .filter(m => {
        // robust parsing fallback if date_mesure is not already a Date
        const date = m?.date_mesure instanceof Date ? m.date_mesure : new Date(m.date_mesure);
        return date >= startDate && date <= endDate;
      })
      .map(m => ({
        date: m.date_mesure ? (m.date_mesure instanceof Date ? m.date_mesure.toLocaleString() : new Date(m.date_mesure).toLocaleString()) : String(m.id ?? ""),
        value: typeof m.valeur === "number" ? m.valeur : Number(m.valeur || 0),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const shouldUseClinicsData = clinicsData && clinicsData.length > 0;
  const totalActiveAlerts = (alertes || []).filter(isAlerteActive).length;

  const PERIODS: { key: PeriodOption; label: string }[] = [
    { key: "1h", label: "1h" },
    { key: "24h", label: "24h" },
    { key: "7d", label: "7j" },
    { key: "30d", label: "30j" },
    { key: "custom", label: "Personnalisé" },
  ];

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
                <button
                  type="button"
                  onClick={() => setSelectedSensor(null)}
                  className="text-sm underline"
                >
                  ← Retour aux cartes
                </button>

                <div className="flex items-center space-x-2">
                  {PERIODS.map(({ key, label }) => {
                    const active = chartPeriod === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setChartPeriod(key)}
                        aria-pressed={active}
                        className={
                          `px-3 py-1 rounded-full transition-flex flex items-center justify-center text-sm ` +
                          (active
                            ? "border-2 border-black shadow-sm bg-white"
                            : "border border-gray-300 bg-white hover:bg-gray-100")
                        }
                      >
                        <span className="text-sm">{label}</span>
                      </button>
                    );
                  })}

                  {chartPeriod === "custom" && (
                    <div className="flex items-center space-x-2 ml-4">
                      <label className="text-sm">Du:</label>
                      <input type="date" value={dateFrom ?? ""} onChange={(e) => setDateFrom(e.target.value ?? null)} className="border rounded px-2 py-1 text-sm" />
                      <label className="text-sm">Au:</label>
                      <input type="date" value={dateTo ?? ""} onChange={(e) => setDateTo(e.target.value ?? null)} className="border rounded px-2 py-1 text-sm" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold">
                  Graphique — {selectedSensor?.matricule ?? `#${selectedSensor?.id}`}
                </h4>

                <div className="mt-2">
                  {filterMeasuresByPeriod(selectedSensor).length === 0 ? (
                    <div className="text-muted-foreground">Aucune mesure disponible pour ce capteur.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={filterMeasuresByPeriod(selectedSensor)}
                        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        {selectedSensor?.seuil_max != null && (
                          <ReferenceLine y={selectedSensor.seuil_max} stroke="red" strokeDasharray="4 4" label="Seuil max" />
                        )}
                        {selectedSensor?.seuil_min != null && (
                          <ReferenceLine y={selectedSensor.seuil_min} stroke="green" strokeDasharray="4 4" label="Seuil min" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingSensors ? (
                <div className="col-span-full flex justify-center items-center py-8 text-muted-foreground">
                  Chargement des capteurs...
                </div>
              ) : sensors.length === 0 ? (
                <div className="col-span-full flex justify-center py-8 text-muted-foreground">
                  Aucun capteur trouvé.
                </div>
              ) : (
                sensors.map(sensor => (
                  <SensorCard
                    key={String(sensor.id)}
                    sensor={sensor}
                    showFullHierarchy={isFullCapteurs}
                    // si les counts sont en cours, on passe undefined pour permettre au SensorCard d'afficher un spinner ou valeur placeholder
                    alertesCount={loadingCounts ? undefined : alertesActiveMap[Number(sensor.id)] ?? 0}
                    totalAlertes={loadingCounts ? undefined : alertesTotalsMap[Number(sensor.id)] ?? 0}
                    showEvolution
                    onShowChart={id => {
                      const s = sensors.find(x => String(x.id) === String(id)) || sensor;
                      setSelectedSensor(s as Sensor);
                      onShowSensorEvolution?.(id);
                    }}
                  />
                ))
              )}
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
          <AlertsPanel  />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DashboardOverview;

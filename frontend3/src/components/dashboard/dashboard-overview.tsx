// frontend3/src/components/dashboard/dashboard-overview.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SensorCard, { Sensor } from "./sensor-card";
import { AlertsPanel } from "./alerts-panel";
import { ClinicOverview } from "./clinic-overview";
import { getSensors, getSensorAlertCount } from "../sensors/sensor-api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

interface DashboardOverviewProps {
  sensors?: Sensor[];
  alertes?: any[];
  onResolveAlert?: (alerteId: string) => void;
  onIgnoreAlert?: (alerteId: string) => void;
  onShowSensorEvolution?: (sensorId: string | number) => void;
}

type PeriodOption = "1h" | "24h" | "7d" | "30d" | "custom";

export function DashboardOverview({
  sensors: propsSensors = [],
  alertes = [],
  onResolveAlert,
  onIgnoreAlert,
  onShowSensorEvolution,
}: DashboardOverviewProps) {
  const [sensors, setSensors] = useState<Sensor[]>(Array.isArray(propsSensors) ? propsSensors : []);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [chartPeriod, setChartPeriod] = useState<PeriodOption>("1h");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const [alertesTotalsMap, setAlertesTotalsMap] = useState<Record<number, number>>({});
  const [alertesActiveMap, setAlertesActiveMap] = useState<Record<number, number>>({});
  const [loadingSensors, setLoadingSensors] = useState<boolean>(false);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);

  const isFullCapteurs = sensors.length > 0 && "famille" in sensors[0];

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

  // après avoir chargé "sensors", on récupère counts via endpoint /capteurs/{id}/alertes/nbr
  useEffect(() => {
    if (!sensors || sensors.length === 0) return;

    const fetchCountsForAll = async () => {
      setLoadingCounts(true);
      try {
        // Promise.all en parallèle
        const results = await Promise.all(
          sensors.map(async (s) => {
            try {
              const res = await getSensorAlertCount(Number(s.id));
              // debug log
              console.log(`count for sensor ${s.id}:`, res);
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
            // la réponse attendue: { capteur_id, total_alertes, active_alertes }
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

  const filterMeasuresByPeriod = (sensor: Sensor) => {
    if (!sensor.mesures || sensor.mesures.length === 0) return [];
    const now = new Date();
    let startDate: Date;
    switch (chartPeriod) {
      case "1h": startDate = new Date(now.getTime() - 60 * 60 * 1000); break;
      case "24h": startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case "7d": startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case "30d": startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case "custom": startDate = customRange?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    const endDate = chartPeriod === "custom" ? (customRange?.end || now) : now;
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

              {/* SensorChart si tu veux l'utiliser */}
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
                        {selectedSensor.seuil_max != null && <ReferenceLine y={selectedSensor.seuil_max} stroke="red" strokeDasharray="4 4" label="Seuil max" />}
                        {selectedSensor.seuil_min != null && <ReferenceLine y={selectedSensor.seuil_min} stroke="green" strokeDasharray="4 4" label="Seuil min" />}
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
                  alertesCount={alertesActiveMap[sensor.id] ?? 0}
                  totalAlertes={alertesTotalsMap[sensor.id] ?? 0}
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
          {isFullCapteurs ? <ClinicOverview capteurs={sensors as any} alertes={alertes} /> :
            <div className="text-center py-8 text-muted-foreground">
              Vue cliniques disponible uniquement avec le modèle de données complet
            </div>}
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsPanel alertes={alertes} onResolveAlert={onResolveAlert} onIgnoreAlert={onIgnoreAlert} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DashboardOverview;

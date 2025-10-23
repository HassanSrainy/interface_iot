// frontend3/src/components/dashboard/dashboard-overview-user.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SensorCard, { Sensor } from "./sensor-card";
import AlertsPanelUser from "./alerts-panel-user";
import ClinicOverview from "./clinic-overview";
import { getSensorsByUser } from "../sensors/sensor-api";
import { getAlertesByUser } from "../alertes/alertes-api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Alerte as DomainAlerte } from "../../types/domain";

interface DashboardOverviewUserProps {
  user: { id: number; email?: string } | null;
  onShowSensorEvolution?: (sensorId: string | number) => void;
}

type PeriodOption = "1h" | "24h" | "7d" | "30d" | "custom";

const DEBUG_MEASURES = true;

function parseDateMesureLocal(raw: unknown): Date | null {
  if (raw == null) return null;
  if (raw instanceof Date) return raw;

  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber)) {
    const s = String(raw).trim();
    if (/^\d{10}$/.test(s)) return new Date(asNumber * 1000);
    return new Date(asNumber);
  }

  const str = String(raw).trim();
  const d1 = new Date(str);
  if (!isNaN(d1.getTime())) return d1;

  const d2 = new Date(str.replace(" ", "T"));
  if (!isNaN(d2.getTime())) return d2;

  try {
    const cleaned = str.replace(/(\.\d+)?$/, "");
    const d3 = new Date(cleaned);
    if (!isNaN(d3.getTime())) return d3;
  } catch {}

  return null;
}

function extractMesuresFromSensor(sensor: any): any[] {
  if (!sensor) return [];
  if (Array.isArray(sensor.mesures)) return sensor.mesures;
  if (Array.isArray(sensor.measurements)) return sensor.measurements;
  if (Array.isArray(sensor.readings)) return sensor.readings;
  return [];
}

const startOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T00:00:00`).getTime();
const endOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T23:59:59.999`).getTime();

export function DashboardOverviewUser({ user, onShowSensorEvolution }: DashboardOverviewUserProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [chartPeriod, setChartPeriod] = useState<PeriodOption>("1h");

  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  const [alertes, setAlertes] = useState<DomainAlerte[]>([]);
  const [alertesTotalsMap, setAlertesTotalsMap] = useState<Record<number, number>>({});
  const [alertesActiveMap, setAlertesActiveMap] = useState<Record<number, number>>({});
  const [loadingSensors, setLoadingSensors] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const selectedSensorMemo = useMemo(() => selectedSensor, [selectedSensor]);

  const loadAll = useCallback(async () => {
    if (!user?.id) return;
    setLoadingSensors(true);
    try {
      const rawSensors = await getSensorsByUser(user.id);
      const normalized: any[] = Array.isArray(rawSensors) ? rawSensors : [];

      const withMesures = normalized.map((s: any) => {
        const rawMesures = extractMesuresFromSensor(s);
        const mesuresWithTs = Array.isArray(rawMesures)
          ? rawMesures.map((m: any) => {
              const candidate = m?.date_mesure ?? m?.date ?? m?.created_at ?? m?.timestamp ?? null;
              const d = parseDateMesureLocal(candidate);
              const _ts = d ? d.getTime() : null;
              return { ...m, _ts };
            })
          : [];
        return { ...s, mesures: mesuresWithTs };
      });

      setSensors(withMesures as any);

      setLoadingCounts(true);
      try {
        const rawAlertes = await getAlertesByUser(user.id);
        const arr = Array.isArray(rawAlertes) ? rawAlertes : [];

        const nowIso = new Date().toISOString();
        const mapped = arr.map((a: any): DomainAlerte => ({
          ...(a ?? {}),
          created_at: a?.created_at ?? a?.createdAt ?? nowIso,
          updated_at: a?.updated_at ?? a?.updatedAt ?? nowIso,
        } as DomainAlerte));

        setAlertes(mapped);

        const totals: Record<number, number> = {};
        const actives: Record<number, number> = {};
        withMesures.forEach((s: any) => {
          const sAlertes = mapped.filter((al) => Number((al as any).capteur_id) === Number(s.id));
          totals[Number(s.id)] = sAlertes.length;
          actives[Number(s.id)] = sAlertes.filter(
            (al) =>
              String(((al as any).statut ?? (al as any).status ?? "")).toLowerCase() === "actif" ||
              String(((al as any).statut ?? (al as any).status ?? "")).toLowerCase() === "active"
          ).length;
        });
        setAlertesTotalsMap((prev) => ({ ...prev, ...totals }));
        setAlertesActiveMap((prev) => ({ ...prev, ...actives }));
      } finally {
        setLoadingCounts(false);
      }
    } catch (err) {
      console.error("Erreur loadAll DashboardOverviewUser:", err);
      setSensors([]);
      setAlertes([]);
      setAlertesTotalsMap({});
      setAlertesActiveMap({});
    } finally {
      setLoadingSensors(false);
    }
  }, [user]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, [loadAll]);

  useEffect(() => {
    if (!selectedSensor) return;
    const found = sensors.find((s) => String(s.id) === String(selectedSensor.id));
    if (!found) {
      if (DEBUG_MEASURES) console.info("selectedSensor removed after refresh, clearing selection", selectedSensor.id);
      setSelectedSensor(null);
    } else if (found && found !== selectedSensor) {
      setSelectedSensor(found as any);
      if (DEBUG_MEASURES) console.info("selectedSensor re-synced to latest object", found.id);
    }
  }, [sensors, selectedSensor]);

  const openChart = (idOrSensor: any) => {
    if (idOrSensor == null) return;
    const id = typeof idOrSensor === "object" ? idOrSensor.id ?? idOrSensor : idOrSensor;
    const matched = sensors.find((s) => String(s.id) === String(id));
    if (matched) {
      setSelectedSensor(matched as any);
    } else if (typeof idOrSensor === "object" && idOrSensor?.id != null) {
      setSelectedSensor(idOrSensor as Sensor);
    } else {
      console.warn("openChart: sensor not found in sensors list", idOrSensor);
      setSelectedSensor(null);
    }
    setChartPeriod("1h");
    onShowSensorEvolution?.(id);
  };

  const filterMeasuresByPeriod = useCallback(
    (sensor: Sensor | null | undefined) => {
      if (!sensor) return [];
      const rawMesures: any[] = Array.isArray((sensor as any).mesures) ? (sensor as any).mesures : [];
      if (rawMesures.length === 0) return [];

      const nowTs = Date.now();
      let startTs = nowTs - 24 * 60 * 60 * 1000;
      let endTs = nowTs;

      if (chartPeriod === "1h") startTs = nowTs - 60 * 60 * 1000;
      else if (chartPeriod === "24h") startTs = nowTs - 24 * 60 * 60 * 1000;
      else if (chartPeriod === "7d") startTs = nowTs - 7 * 24 * 60 * 60 * 1000;
      else if (chartPeriod === "30d") startTs = nowTs - 30 * 24 * 60 * 60 * 1000;
      else if (chartPeriod === "custom") {
        if (dateFrom && dateTo) {
          startTs = startOfDayTs(dateFrom);
          endTs = endOfDayTs(dateTo);
          if (startTs > endTs) {
            const tmp = startTs;
            startTs = endTs;
            endTs = tmp;
          }
        } else {
          return [];
        }
      }

      const parsed = rawMesures.map((m: any) => {
        const tsFromField = typeof m._ts === "number" ? m._ts : null;
        if (tsFromField) return { ts: tsFromField, value: Number(m.valeur ?? m.value ?? 0), raw: m };
        const candidate = m?.date_mesure ?? m?.date ?? m?.created_at ?? m?.timestamp ?? null;
        const d = parseDateMesureLocal(candidate);
        const ts = d ? d.getTime() : null;
        return { ts, value: Number(m.valeur ?? m.value ?? 0), raw: m };
      });

      const inside = parsed
        .filter((p: any) => p && typeof p.ts === "number" && !Number.isNaN(p.ts) && p.ts >= startTs && p.ts <= endTs)
        .sort((a: any, b: any) => a.ts - b.ts)
        .map((p: any) => ({ date: new Date(p.ts).toLocaleString(), value: p.value }));

      if (DEBUG_MEASURES) {
        const parsedAll = parsed.filter((p) => p && typeof p.ts === "number") as any[];
        const outside = parsedAll.filter((p) => p.ts < startTs || p.ts > endTs);
        console.group(`[filterMeasuresByPeriod] sensor ${sensor.id} — period ${chartPeriod}`);
        console.log("raw count:", rawMesures.length);
        console.log("parsed:", parsedAll.length);
        console.log("inside:", inside.length, inside.slice(0, 10));
        if (outside.length > 0) console.log("outside sample:", outside.slice(0, 10));
        console.groupEnd();
      }

      return inside;
    },
    [chartPeriod, dateFrom, dateTo]
  );

  const PERIODS: { key: PeriodOption; label: string }[] = [
    { key: "1h", label: "1h" },
    { key: "24h", label: "24h" },
    { key: "7d", label: "7j" },
    { key: "30d", label: "30j" },
    { key: "custom", label: "Personnalisé" },
  ];

  const totalActiveAlerts = alertes.filter((a) => {
    const s = String(((a as any).statut ?? (a as any).status ?? "")).toLowerCase();
    return s === "actif" || s === "active";
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Vue d'ensemble utilisateur</h2>
        <p className="text-muted-foreground">Vos capteurs et alertes — actives : {totalActiveAlerts}</p>
      </div>

      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evolution">Évolution/Capteur</TabsTrigger>
          <TabsTrigger value="clinics">Cliniques</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution">
          {selectedSensorMemo ? (
            <div className="space-y-4">
              {/* ✅ Barre de contrôle professionnelle */}
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedSensor(null)}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Retour aux capteurs
                  </button>

                  <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-lg">
                    {PERIODS.map(({ key, label }) => {
                      const active = chartPeriod === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setChartPeriod(key)}
                          aria-pressed={active}
                          className={
                            `px-4 py-2 rounded-md font-medium text-sm transition-all select-none ` +
                            (active
                              ? "bg-black text-white shadow-md"
                              : "bg-white text-gray-700 hover:bg-gray-100")
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {chartPeriod === "custom" && (
                  <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Du:</label>
                      <input
                        type="date"
                        value={dateFrom ?? ""}
                        onChange={(e) => setDateFrom(e.target.value ?? null)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Au:</label>
                      <input
                        type="date"
                        value={dateTo ?? ""}
                        onChange={(e) => setDateTo(e.target.value ?? null)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Carte graphique professionnelle */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedSensorMemo?.matricule ?? `Capteur #${selectedSensorMemo?.id}`}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {(() => {
                        const famille = (selectedSensorMemo as any)?.famille?.famille || 
                                       (selectedSensorMemo as any)?.famille?.type?.type || 
                                       (selectedSensorMemo as any)?.famille?.nom;
                        const type = (selectedSensorMemo as any)?.famille?.type?.type || 
                                    (selectedSensorMemo as any)?.type;
                        
                        const parts = [];
                        if (famille) parts.push(`Famille: ${famille}`);
                        if (type && type !== famille) parts.push(`Type: ${type}`);
                        if (parts.length === 0) parts.push("Type: N/A");
                        
                        return parts.join(" • ");
                      })()}
                      {(selectedSensorMemo?.seuil_min != null || selectedSensorMemo?.seuil_max != null) && (
                        <> • Plage: {selectedSensorMemo?.seuil_min ?? "—"} - {selectedSensorMemo?.seuil_max ?? "—"}</>
                      )}
                    </p>
                  </div>
                  {(selectedSensorMemo?.seuil_max != null || selectedSensorMemo?.seuil_min != null) && (
                    <div className="flex items-center space-x-4 text-sm">
                      {selectedSensorMemo?.seuil_max != null && (
                        <div className="flex items-center">
                          <div className="w-8 h-0.5 bg-red-500 mr-2"></div>
                          <span className="text-gray-600">Seuil max: {selectedSensorMemo.seuil_max}</span>
                        </div>
                      )}
                      {selectedSensorMemo?.seuil_min != null && (
                        <div className="flex items-center">
                          <div className="w-8 h-0.5 bg-green-500 mr-2"></div>
                          <span className="text-gray-600">Seuil min: {selectedSensorMemo.seuil_min}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {filterMeasuresByPeriod(selectedSensorMemo).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-600 font-medium text-lg mb-2">Aucune donnée disponible</p>
                      <p className="text-gray-500 text-sm text-center max-w-md">
                        Aucune mesure n'a été enregistrée pour ce capteur sur la période sélectionnée.
                        <br />Essayez de sélectionner une autre période ou vérifiez que le capteur transmet correctement ses données.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={filterMeasuresByPeriod(selectedSensorMemo)}
                        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                        />
                        {selectedSensorMemo?.seuil_max != null && (
                          <ReferenceLine 
                            y={selectedSensorMemo.seuil_max} 
                            stroke="red" 
                            strokeDasharray="4 4" 
                            label={{ value: "Seuil max", position: "right", fill: "red" }}
                          />
                        )}
                        {selectedSensorMemo?.seuil_min != null && (
                          <ReferenceLine 
                            y={selectedSensorMemo.seuil_min} 
                            stroke="green" 
                            strokeDasharray="4 4" 
                            label={{ value: "Seuil min", position: "right", fill: "green" }}
                          />
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
                sensors.map((sensor) => (
                  <SensorCard
                    key={String(sensor.id)}
                    sensor={sensor}
                    alertesCount={loadingCounts ? undefined : alertesActiveMap[Number(sensor.id)] ?? 0}
                    totalAlertes={loadingCounts ? undefined : alertesTotalsMap[Number(sensor.id)] ?? 0}
                    showFullHierarchy={true}
                    showEvolution
                    onShowChart={(idOrSensor) => {
                      openChart(idOrSensor);
                    }}
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clinics">
          <ClinicOverview capteurs={sensors as any} alertes={alertes} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsPanelUser />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DashboardOverviewUser;
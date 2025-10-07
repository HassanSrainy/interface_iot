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

// si ton type Alerte est dans ../../types/domain, garde ; sinon remplacer par `any`
import { Alerte as DomainAlerte } from "../../types/domain";

interface DashboardOverviewUserProps {
  user: { id: number; email?: string } | null;
  onShowSensorEvolution?: (sensorId: string | number) => void;
}

type PeriodOption = "1h" | "24h" | "7d" | "30d" | "custom";

/* debug utile pendant dev */
const DEBUG_MEASURES = true;

/* parseur robuste */
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

/* helper pour récupérer la liste de mesures depuis l'objet capteur (divers noms possibles) */
function extractMesuresFromSensor(sensor: any): any[] {
  if (!sensor) return [];
  if (Array.isArray(sensor.mesures)) return sensor.mesures;
  if (Array.isArray(sensor.measurements)) return sensor.measurements;
  if (Array.isArray(sensor.readings)) return sensor.readings;
  return [];
}

/* util : timestamp début/fin d'une date YYYY-MM-DD */
const startOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T00:00:00`).getTime();
const endOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T23:59:59.999`).getTime();

/** Composant principal */
export function DashboardOverviewUser({ user, onShowSensorEvolution }: DashboardOverviewUserProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [chartPeriod, setChartPeriod] = useState<PeriodOption>("1h");

  // plage custom
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

      // normaliser et precalcule _ts pour chaque mesure
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

      // alertes
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

        // totaux / actifs
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

  // resync selection si sensors rafraichis
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

  // filtrer mesures selon période ou plage custom
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
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setSelectedSensor(null)} className="text-sm underline">
                  ← Retour aux cartes
                </button>

                <div className="flex items-center space-x-3">
                  {PERIODS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setChartPeriod(key)}
                      aria-pressed={chartPeriod === key}
                      className={`px-3 py-1 rounded-full text-sm ${
                        chartPeriod === key ? "border-2 border-black bg-white shadow-sm" : "border border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                  {chartPeriod === "custom" && (
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">Du:</label>
                      <input
                        type="date"
                        value={dateFrom ?? ""}
                        onChange={(e) => setDateFrom(e.target.value ?? null)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <label className="text-sm">Au:</label>
                      <input
                        type="date"
                        value={dateTo ?? ""}
                        onChange={(e) => setDateTo(e.target.value ?? null)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold">Graphique — {selectedSensorMemo?.matricule ?? `#${selectedSensorMemo?.id}`}</h4>

                {filterMeasuresByPeriod(selectedSensorMemo).length === 0 ? (
                  <div className="text-muted-foreground">Aucune mesure disponible pour ce capteur.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filterMeasuresByPeriod(selectedSensorMemo)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      {selectedSensorMemo?.seuil_max != null && (
                        <ReferenceLine y={selectedSensorMemo.seuil_max} stroke="red" strokeDasharray="4 4" label="Seuil max" />
                      )}
                      {selectedSensorMemo?.seuil_min != null && (
                        <ReferenceLine y={selectedSensorMemo.seuil_min} stroke="green" strokeDasharray="4 4" label="Seuil min" />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingSensors ? (
                <div className="col-span-full flex justify-center py-8 text-muted-foreground">Chargement des capteurs...</div>
              ) : sensors.length === 0 ? (
                <div className="col-span-full flex justify-center py-8 text-muted-foreground">Aucun capteur trouvé.</div>
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

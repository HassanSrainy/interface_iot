// frontend3/src/components/dashboard/dashboard-overview-user.tsx
import React, { useCallback, useEffect, useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SensorCard, { Sensor } from "./sensor-card";
import AlertsPanelUser from "./alerts-panel-user";
import ClinicOverview from "./clinic-overview";
import { getSensorsByUser, getSensorsAlertCountsByUser, getSensorMesuresByUser } from "../sensors/sensor-api";
import { getAlertesByUser } from "../alertes/alertes-api";
import { ChartTimeFilter } from "../charts/ChartTimeFilter";
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

interface DashboardOverviewUserProps {
  user: { id: number; email?: string } | null;
  sensors?: Sensor[];
  alertes?: any[];
  onShowSensorEvolution?: (sensorId: string | number) => void;
}

type PeriodOption = "1h" | "24h" | "7d" | "30d" | "custom";

const startOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T00:00:00`).getTime();
const endOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T23:59:59.999`).getTime();

export function DashboardOverviewUser({ 
  user,
  sensors: propsSensors = [],
  alertes: propsAlertes = [],
  onShowSensorEvolution 
}: DashboardOverviewUserProps) {
  
  // ========================================
  // 📦 STATES
  // ========================================
  const [sensors, setSensors] = useState<Sensor[]>(Array.isArray(propsSensors) ? propsSensors : []);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [chartPeriod, setChartPeriod] = useState<PeriodOption>("1h");

  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  const [loadingSensors, setLoadingSensors] = useState<boolean>(false);
  const [alertesTotalsMap, setAlertesTotalsMap] = useState<Record<number, number>>({});
  const [alertesActiveMap, setAlertesActiveMap] = useState<Record<number, number>>({});
  const [loadingAlertCounts, setLoadingAlertCounts] = useState<boolean>(false);

  const [sensorMesures, setSensorMesures] = useState<any[]>([]);
  const [loadingMesures, setLoadingMesures] = useState<boolean>(false);
  const [mesuresError, setMesuresError] = useState<string | null>(null);

  const [fetchedAlertes, setFetchedAlertes] = useState<any[]>(Array.isArray(propsAlertes) ? propsAlertes : []);
  const [loadingAlertes, setLoadingAlertes] = useState<boolean>(false);
  const [alertesError, setAlertesError] = useState<string | null>(null);

  // ========================================
  // 🔒 REFS - Protection anti-double-chargement
  // ========================================
  const hasLoadedSensors = useRef(false);
  const hasLoadedAlertCounts = useRef(false);

  // ========================================
  // 📊 COMPUTED
  // ========================================
  const isFullCapteurs = sensors.length > 0 && !!(sensors[0] as any)?.service?.floor?.clinique;
  const alertes = propsAlertes && propsAlertes.length > 0 ? propsAlertes : fetchedAlertes;

  // ========================================
  // 📈 CHARGEMENT DES MESURES D'UN CAPTEUR
  // ========================================
  const loadSensorMesures = useCallback(async (
    sensorId: number, 
    period: PeriodOption, 
    customFrom?: string, 
    customTo?: string
  ) => {
    if (!user?.id) return;
    
    setLoadingMesures(true);
    setMesuresError(null);
    
    try {
      let options: any = {};
      
      switch (period) {
        case "1h":
          options.hours = 1;  // ✅ Charge seulement 1 heure
          break;
        case "24h":
          options.hours = 24;  // ✅ Charge 24 heures
          break;
        case "7d":
          options.days = 7;
          break;
        case "30d":
          options.days = 30;
          break;
        case "custom":
          if (customFrom && customTo) {
            options.dateFrom = customFrom;
            options.dateTo = customTo;
          }
          break;
      }
      
      const response = await getSensorMesuresByUser(user.id, sensorId, options);
      setSensorMesures(response.mesures || []);
    } catch (err: any) {
      console.error('Erreur loadSensorMesures:', err);
      setMesuresError(err?.message ?? 'Erreur lors du chargement des mesures');
      setSensorMesures([]);
    } finally {
      setLoadingMesures(false);
    }
  }, [user]);

  // 🔄 Recharger les mesures quand le capteur/période change
  useEffect(() => {
    if (selectedSensor) {
      loadSensorMesures(
        Number(selectedSensor.id), 
        chartPeriod,
        dateFrom ?? undefined,
        dateTo ?? undefined
      );
    }
  }, [selectedSensor, chartPeriod, dateFrom, dateTo, loadSensorMesures]);

  // ========================================
  // 🔢 CHARGEMENT DES COMPTEURS D'ALERTES (en arrière-plan)
  // ========================================
  const loadAlertCountsInBackground = useCallback(async (sensorsToLoad: Sensor[]) => {
    if (!user?.id || sensorsToLoad.length === 0 || hasLoadedAlertCounts.current) return;
    
    setLoadingAlertCounts(true);
    hasLoadedAlertCounts.current = true;
    
    try {
      const sensorIds = sensorsToLoad.map(s => Number(s.id));
      const countsMap = await getSensorsAlertCountsByUser(user.id, sensorIds);
      
      const newTotalsMap: Record<number, number> = {};
      const newActivesMap: Record<number, number> = {};
      
      Object.entries(countsMap).forEach(([id, counts]) => {
        const sensorId = Number(id);
        newTotalsMap[sensorId] = counts.total_alertes;
        newActivesMap[sensorId] = counts.active_alertes;
      });
      
      setAlertesTotalsMap(newTotalsMap);
      setAlertesActiveMap(newActivesMap);
    } catch (err) {
      console.error('Erreur getSensorsAlertCountsByUser:', err);
      const fallbackMap: Record<number, number> = {};
      sensorsToLoad.forEach(s => {
        fallbackMap[Number(s.id)] = 0;
      });
      setAlertesTotalsMap(fallbackMap);
      setAlertesActiveMap(fallbackMap);
    } finally {
      setLoadingAlertCounts(false);
    }
  }, [user]);

  // ========================================
  // 🎯 CHARGEMENT INITIAL DES CAPTEURS (1 fois)
  // ========================================
  useEffect(() => {
    if (!user?.id || hasLoadedSensors.current) return;

    const loadSensorsOnce = async () => {
      setLoadingSensors(true);
      
      try {
        let rawSensors: Sensor[];

        if (propsSensors && propsSensors.length > 0) {
          rawSensors = propsSensors;
        } else {
          rawSensors = await getSensorsByUser(user.id);
        }
        
        const normalizedSensors = (rawSensors || []).map((sensor: any) => ({
          ...sensor,
          status: sensor.status === null ? undefined : sensor.status,
          mesures: undefined,
        }));
        
        setSensors(normalizedSensors);
        hasLoadedSensors.current = true;
        setLoadingSensors(false);
        
        if (normalizedSensors.length > 0) {
          loadAlertCountsInBackground(normalizedSensors);
        }
      } catch (err) {
        console.error("Erreur loadSensors:", err);
        setSensors([]);
        setLoadingSensors(false);
      }
    };

    loadSensorsOnce();
  }, [user, propsSensors, loadAlertCountsInBackground]);

  // ========================================
  // 🔄 RECHARGEMENT SUR CHANGEMENT DE PROPS
  // ========================================
  useEffect(() => {
    if (propsSensors && propsSensors.length > 0 && hasLoadedSensors.current) {
      const normalizedSensors = propsSensors.map((sensor: any) => ({
        ...sensor,
        status: sensor.status === null ? undefined : sensor.status,
        mesures: undefined,
      }));
      setSensors(normalizedSensors);
      
      hasLoadedAlertCounts.current = false;
      loadAlertCountsInBackground(normalizedSensors);
    }
  }, [propsSensors, loadAlertCountsInBackground]);

  // ========================================
  // 🚨 REFRESH DES ALERTES
  // ========================================
  const refreshAlertes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingAlertes(true);
      setAlertesError(null);
      const data = await getAlertesByUser(user.id);
      setFetchedAlertes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erreur refreshAlertes:", err);
      setAlertesError(err?.message ?? "Erreur réseau");
    } finally {
      setLoadingAlertes(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && fetchedAlertes.length === 0 && !propsAlertes?.length) {
      refreshAlertes();
    }
  }, [user, refreshAlertes, fetchedAlertes.length, propsAlertes]);

  // ========================================
  // 📊 FILTRAGE DES MESURES PAR PÉRIODE
  // ========================================
  const filterMeasuresByPeriod = useCallback(() => {
    if (!sensorMesures || sensorMesures.length === 0) return [];
    
    // ✅ Les données sont déjà filtrées par le backend
    // On ne fait que formatter et trier
    return sensorMesures
      .map(m => ({
        date: m.date_mesure 
          ? (m.date_mesure instanceof Date 
              ? m.date_mesure.toLocaleString() 
              : new Date(m.date_mesure).toLocaleString()) 
          : String(m.id ?? ""),
        value: typeof m.valeur === "number" ? m.valeur : Number(m.valeur || 0),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sensorMesures]);

  // ========================================
  // 🎨 UI CONSTANTS
  // ========================================
  const PERIODS: { key: PeriodOption; label: string }[] = [
    { key: "1h", label: "1h" },
    { key: "24h", label: "24h" },
    { key: "7d", label: "7j" },
    { key: "30d", label: "30j" },
    { key: "custom", label: "Personnalisé" },
  ];

  // ========================================
  // 🎨 RENDER
  // ========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Tableau de Bord</h1>
        <p className="text-slate-600 mt-1">Vos capteurs et données en temps réel</p>
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
              {/* Barre de contrôle */}
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSensor(null);
                      setSensorMesures([]);
                    }}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Retour aux capteurs
                  </button>

                  <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-lg border border-gray-200">
                    {PERIODS.map(({ key, label }) => {
                      const active = chartPeriod === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setChartPeriod(key)}
                          aria-pressed={active}
                          style={active ? {
                            backgroundColor: '#1f2937',
                            color: '#ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          } : {
                            backgroundColor: '#ffffff',
                            color: '#4b5563',
                            border: '1px solid #e5e7eb'
                          }}
                          className={
                            `px-4 py-2 rounded-md font-medium text-sm transition-all select-none ` +
                            (active ? "" : "hover:bg-gray-50")
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {chartPeriod === "custom" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Période personnalisée</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Date de début</label>
                          <input
                            type="date"
                            value={dateFrom ?? ""}
                            onChange={(e) => setDateFrom(e.target.value ?? null)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                          <input
                            type="date"
                            value={dateTo ?? ""}
                            onChange={(e) => setDateTo(e.target.value ?? null)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Graphique */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedSensor?.matricule ?? `Capteur #${selectedSensor?.id}`}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {(() => {
                        const famille = (selectedSensor as any)?.famille?.famille || 
                                       (selectedSensor as any)?.famille?.type?.type || 
                                       (selectedSensor as any)?.famille?.nom;
                        const type = (selectedSensor as any)?.famille?.type?.type || 
                                    (selectedSensor as any)?.type;
                        
                        const parts = [];
                        if (famille) parts.push(`Famille: ${famille}`);
                        if (type && type !== famille) parts.push(`Type: ${type}`);
                        if (parts.length === 0) parts.push("Type: N/A");
                        
                        return parts.join(" • ");
                      })()}
                      {(selectedSensor?.seuil_min != null || selectedSensor?.seuil_max != null) && (
                        <> • Plage: {selectedSensor?.seuil_min ?? "—"} - {selectedSensor?.seuil_max ?? "—"}</>
                      )}
                    </p>
                  </div>
                  {(selectedSensor?.seuil_max != null || selectedSensor?.seuil_min != null) && (
                    <div className="flex items-center space-x-4 text-sm">
                      {selectedSensor?.seuil_max != null && (
                        <div className="flex items-center">
                          <div className="w-8 h-0.5 bg-red-500 mr-2"></div>
                          <span className="text-gray-600">Seuil max: {selectedSensor.seuil_max}</span>
                        </div>
                      )}
                      {selectedSensor?.seuil_min != null && (
                        <div className="flex items-center">
                          <div className="w-8 h-0.5 bg-green-500 mr-2"></div>
                          <span className="text-gray-600">Seuil min: {selectedSensor.seuil_min}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {loadingMesures ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm font-medium">Chargement des mesures...</p>
                    </div>
                  ) : mesuresError ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <svg className="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-600 font-medium">{mesuresError}</p>
                    </div>
                  ) : filterMeasuresByPeriod().length === 0 ? (
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
                        data={filterMeasuresByPeriod()}
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
                        {selectedSensor?.seuil_max != null && (
                          <ReferenceLine 
                            y={selectedSensor.seuil_max} 
                            stroke="red" 
                            strokeDasharray="4 4" 
                            label={{ value: "Seuil max", position: "right", fill: "red" }}
                          />
                        )}
                        {selectedSensor?.seuil_min != null && (
                          <ReferenceLine 
                            y={selectedSensor.seuil_min} 
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
                sensors.map((sensor) => {
                  const sensorId = Number(sensor.id);
                  return (
                    <SensorCard
                      key={String(sensor.id)}
                      sensor={sensor}
                      showFullHierarchy={isFullCapteurs}
                      alertesCount={
                        loadingAlertCounts 
                          ? undefined 
                          : alertesActiveMap[sensorId] ?? 0
                      }
                      totalAlertes={
                        loadingAlertCounts 
                          ? undefined 
                          : alertesTotalsMap[sensorId] ?? 0
                      }
                      showEvolution
                      onShowChart={id => {
                        const s = sensors.find(x => String(x.id) === String(id)) || sensor;
                        setSelectedSensor(s as Sensor);
                        setSensorMesures([]);
                        onShowSensorEvolution?.(id);
                      }}
                    />
                  );
                })
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
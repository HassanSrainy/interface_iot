// frontend3/src/components/dashboard/dashboard-overview.tsx
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, Legend, Area, AreaChart, RadialBarChart, RadialBar } from "recharts";
import { useSensors, useSensorsAlertCounts, useSensorMesures } from "../../queries/sensors";
import { useAlertes } from "../../queries/alertes";
import { useCliniques } from "../../queries/cliniques";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { AlertsPanel } from "./alerts-panel";
import ClinicOverview from "./clinic-overview";
import SensorCard, { Sensor } from "./sensor-card";
import { ChartTimeFilter } from "../charts/ChartTimeFilter";

interface DashboardOverviewProps {
  sensors?: Sensor[];
  alertes?: any[];
  onResolveAlert?: (alerteId: string) => void;
  onIgnoreAlert?: (alerteId: string) => void;
  onShowSensorEvolution?: (sensorId: string | number) => void;
}

type PeriodOption = "1h" | "24h" | "7d" | "30d" | "custom";

const startOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T00:00:00`).getTime();
const endOfDayTs = (dateYMD: string) => new Date(`${dateYMD}T23:59:59.999`).getTime();

export function DashboardOverview({
  sensors: propsSensors = [],
  alertes: propsAlertes = [],
  onShowSensorEvolution,
}: DashboardOverviewProps) {
  const [sensors, setSensors] = useState<Sensor[]>(Array.isArray(propsSensors) ? propsSensors : []);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [chartPeriod, setChartPeriod] = useState<PeriodOption>("1h");

  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  const [alertesTotalsMap, setAlertesTotalsMap] = useState<Record<number, number>>({});
  const [alertesActiveMap, setAlertesActiveMap] = useState<Record<number, number>>({});

  const [sensorMesures, setSensorMesures] = useState<any[]>([]);

  const isFullCapteurs = sensors.length > 0 && !!(sensors[0] as any)?.service?.floor?.clinique;

  // Use react-query for sensors
  const sensorsQuery = useSensors();
  const loadingSensors = sensorsQuery.isLoading;

  useEffect(() => {
    if (sensorsQuery.data) {
      const rawSensors: any[] = sensorsQuery.data as any[];
      const normalizedSensors = (rawSensors || []).map((sensor: any) => ({
        ...sensor,
        status: sensor.status === null ? undefined : sensor.status,
        mesures: undefined,
      }));
      setSensors(normalizedSensors);
    }
  }, [sensorsQuery.data]);

  // Use react-query for alert counts
  const sensorIds = sensors.map(s => Number(s.id));
  const alertCountsQuery = useSensorsAlertCounts(sensorIds.length > 0 ? sensorIds : undefined as any);
  const loadingAlertCounts = alertCountsQuery.isLoading;

  useEffect(() => {
    if (alertCountsQuery.data) {
      const countsMap = alertCountsQuery.data as Record<string, any>;
      const newTotalsMap: Record<number, number> = {};
      const newActivesMap: Record<number, number> = {};
      Object.entries(countsMap).forEach(([id, counts]: [string, any]) => {
        const sensorId = Number(id);
        newTotalsMap[sensorId] = (counts && counts.total_alertes) ? counts.total_alertes : 0;
        newActivesMap[sensorId] = (counts && counts.active_alertes) ? counts.active_alertes : 0;
      });
      setAlertesTotalsMap(newTotalsMap);
      setAlertesActiveMap(newActivesMap);
    }
  }, [alertCountsQuery.data]);

  // Use react-query for alertes
  const alertesQuery = useAlertes();
  const loadingAlertes = alertesQuery.isLoading;
  const alertesError = alertesQuery.error ? (alertesQuery.error as any).message : null;
  const alertes = propsAlertes && propsAlertes.length > 0 ? propsAlertes : (alertesQuery.data || []);

  // Use react-query for cliniques
  const cliniquesQuery = useCliniques();
  const clinicsLoading = cliniquesQuery.isLoading;
  const clinicsDataRaw = cliniquesQuery.data || [];

  // Enrich clinics data with active alert counts
  const clinicsData = useMemo(() => {
    if (!clinicsDataRaw || clinicsDataRaw.length === 0) return [];
    if (!alertes || alertes.length === 0) return clinicsDataRaw.map((c: any) => ({ ...c, alertesActives: 0 }));

    // Helper to check if alert is active
    const isActive = (a: any) => {
      const s = String((a?.statut ?? a?.status ?? "")).toLowerCase();
      return s === "active" || s === "actif";
    };

    // Build map of capteur -> clinic
    const capToClinic = new Map<string | number, string>();
    for (const clinic of clinicsDataRaw) {
      const clinicId = String((clinic as any).id);
      const capteurs = (clinic as any).capteurs || [];
      for (const cap of capteurs) {
        const capId = (cap as any).id;
        if (capId != null) {
          capToClinic.set(capId, clinicId);
          capToClinic.set(String(capId), clinicId);
        }
      }
    }

    // Count active alerts per clinic
    const alertCountMap = new Map<string, number>();
    for (const alert of alertes) {
      if (!isActive(alert)) continue;
      
      const capRef = (alert as any).capteur ?? (alert as any).capteur_id ?? null;
      const capId = typeof capRef === "object" ? capRef?.id : capRef;
      
      if (capId == null) continue;
      
      const clinicId = capToClinic.get(capId) ?? capToClinic.get(String(capId));
      if (clinicId) {
        alertCountMap.set(clinicId, (alertCountMap.get(clinicId) ?? 0) + 1);
      }
    }

    // Enrich each clinic with alert count
    return clinicsDataRaw.map((c: any) => ({
      ...c,
      alertesActives: alertCountMap.get(String(c.id)) ?? 0
    }));
  }, [clinicsDataRaw, alertes]);

  // Use react-query for selected sensor mesures
  const mesuresOptions: any = {};
  switch (chartPeriod) {
    case '1h':
    case '24h':
      mesuresOptions.days = 1;
      break;
    case '7d':
      mesuresOptions.days = 7;
      break;
    case '30d':
      mesuresOptions.days = 30;
      break;
    case 'custom':
      // custom date range will be attached below when dateFrom/dateTo are present
      break;
    default:
      mesuresOptions.days = 1;
  }
  // attach custom date range when needed
  if (chartPeriod === 'custom') {
    if (dateFrom) mesuresOptions.dateFrom = dateFrom;
    if (dateTo) mesuresOptions.dateTo = dateTo;
  }

  const mesuresQuery = useSensorMesures(selectedSensor ? Number(selectedSensor.id) : undefined, mesuresOptions);
  const loadingMesures = mesuresQuery?.isLoading ?? false;
  const mesuresError = (mesuresQuery?.error as any)?.message ?? null;

  // Sync mesuresQuery data to sensorMesures state
  useEffect(() => {
    if (mesuresQuery?.data) {
      const data = mesuresQuery.data as any;
      const mesures = data?.mesures || [];
      setSensorMesures(mesures);
    }
  }, [mesuresQuery?.data]);

  const filterMeasuresByPeriod = useCallback(() => {
    if (!sensorMesures || sensorMesures.length === 0) return [];
    
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
            [startDate, endDate] = [endDate, startDate];
          }
        } else {
          return [];
        }
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return sensorMesures
      .filter(m => {
        const date = m?.date_mesure instanceof Date 
          ? m.date_mesure 
          : new Date(m.date_mesure);
        return date >= startDate && date <= endDate;
      })
      .map(m => ({
        date: m.date_mesure 
          ? (m.date_mesure instanceof Date 
              ? m.date_mesure.toLocaleString() 
              : new Date(m.date_mesure).toLocaleString()) 
          : String(m.id ?? ""),
        value: typeof m.valeur === "number" ? m.valeur : Number(m.valeur || 0),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sensorMesures, chartPeriod, dateFrom, dateTo]);

  const PERIODS: { key: PeriodOption; label: string }[] = [
    { key: "1h", label: "1h" },
    { key: "24h", label: "24h" },
    { key: "7d", label: "7j" },
    { key: "30d", label: "30j" },
    { key: "custom", label: "Personnalisé" },
  ];

  // --------- sensors list controls: search / filter / sort / pagination
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatusSelect, setFilterStatusSelect] = useState<"all" | "online" | "offline">("all");
  const [filterFamily, setFilterFamily] = useState<string | "all">("all");
  const [sortKey, setSortKey] = useState<"matricule" | "status" | "alerts" | "last_measure">("matricule");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number>(9);
  const [pageIndex, setPageIndex] = useState<number>(0);

  const familyOptions = useMemo(() => {
    const s = new Set<string>();
    sensors.forEach((sen: any) => {
      const fam = sen.famille?.famille ?? sen.famille?.nom ?? sen.famille?.type?.type;
      if (fam) s.add(String(fam));
    });
    return ["all", ...Array.from(s)];
  }, [sensors]);

  const filteredSensors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sensors.filter((s: any) => {
      if (filterStatusSelect !== "all") {
        const st = String(s.status ?? "").toLowerCase();
        if (filterStatusSelect === "online" && st !== "online") return false;
        if (filterStatusSelect === "offline" && st === "online") return false;
      }
      if (filterFamily !== "all") {
        const fam = s.famille?.famille ?? s.famille?.nom ?? s.famille?.type?.type ?? "";
        if (String(fam) !== filterFamily) return false;
      }
      if (q === "") return true;
      return (
        String(s.matricule ?? s.nom ?? "").toLowerCase().includes(q) ||
        String(s.service?.nom ?? "").toLowerCase().includes(q) ||
        String(s.service?.floor?.nom ?? "").toLowerCase().includes(q) ||
        String(s.service?.floor?.clinique?.nom ?? "").toLowerCase().includes(q)
      );
    });
  }, [sensors, searchTerm, filterStatusSelect, filterFamily]);

  const sortedSensors = useMemo(() => {
    const arr = [...filteredSensors];
    arr.sort((a: any, b: any) => {
      let va: any = a[sortKey as any];
      let vb: any = b[sortKey as any];
      if (sortKey === "alerts") {
        va = alertesActiveMap[Number(a.id)] ?? 0;
        vb = alertesActiveMap[Number(b.id)] ?? 0;
      }
      if (sortKey === "last_measure") {
        va = a.derniere_mesure?.date_mesure ?? a.derniere_mesure?.date ?? null;
        vb = b.derniere_mesure?.date_mesure ?? b.derniere_mesure?.date ?? null;
      }
      if (va == null) va = "";
      if (vb == null) vb = "";

      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va - vb) : (vb - va);
    });
    return arr;
  }, [filteredSensors, sortKey, sortDir, alertesActiveMap]);

  const totalPages = Math.max(1, Math.ceil(sortedSensors.length / pageSize));
  const sensorsPage = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedSensors.slice(start, start + pageSize);
  }, [sortedSensors, pageIndex, pageSize]);

  // --------- clinics list controls: search / filter / sort / pagination
  const [clinicSearch, setClinicSearch] = useState<string>("");
  const [clinicFilterHasAlerts, setClinicFilterHasAlerts] = useState<'all' | 'has' | 'none'>('all');
  const [clinicSortKey, setClinicSortKey] = useState<'name' | 'capteursEnLigne' | 'alertesActive' | 'totalAlertes'>('name');
  const [clinicSortDir, setClinicSortDir] = useState<'asc' | 'desc'>('asc');
  const [clinicPageSize, setClinicPageSize] = useState<number>(6);
  const [clinicPageIndex, setClinicPageIndex] = useState<number>(0);

  const filteredClinics = useMemo(() => {
    if (!clinicsData || clinicsData.length === 0) return [];
    const q = clinicSearch.trim().toLowerCase();
    return clinicsData.filter((c: any) => {
      if (clinicFilterHasAlerts === 'has' && !(c.alertesActives > 0 || c.totalAlertes > 0)) return false;
      if (clinicFilterHasAlerts === 'none' && (c.alertesActives > 0 || c.totalAlertes > 0)) return false;
      if (q === '') return true;
      return (
        String(c.nom ?? '').toLowerCase().includes(q) ||
        String(c.adresse ?? '').toLowerCase().includes(q)
      );
    });
  }, [clinicsData, clinicSearch, clinicFilterHasAlerts]);

  const sortedClinics = useMemo(() => {
    const arr = [...(filteredClinics || [])];
    arr.sort((a: any, b: any) => {
      let va: any;
      let vb: any;
      switch (clinicSortKey) {
        case 'capteursEnLigne':
          va = a.capteursEnLigne ?? 0; vb = b.capteursEnLigne ?? 0; break;
        case 'alertesActive':
          va = a.alertesActives ?? 0; vb = b.alertesActives ?? 0; break;
        case 'totalAlertes':
          va = a.totalAlertes ?? 0; vb = b.totalAlertes ?? 0; break;
        case 'name':
        default:
          va = String(a.nom ?? '').toLowerCase(); vb = String(b.nom ?? '').toLowerCase(); break;
      }

      if (typeof va === 'string' && typeof vb === 'string') {
        return clinicSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return clinicSortDir === 'asc' ? (va - vb) : (vb - va);
    });
    return arr;
  }, [filteredClinics, clinicSortKey, clinicSortDir]);

  const clinicTotalPages = Math.max(1, Math.ceil(sortedClinics.length / clinicPageSize));
  const clinicsPage = useMemo(() => {
    const start = clinicPageIndex * clinicPageSize;
    return sortedClinics.slice(start, start + clinicPageSize);
  }, [sortedClinics, clinicPageIndex, clinicPageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Tableau de Bord</h1>
        <p className="text-slate-600 mt-1">Aperçu de vos capteurs IoT et données en temps réel</p>
      </div>

      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution">Évolution/Capteur</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="clinics">Cliniques</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution">
          {selectedSensor ? (
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSensor(null);
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
            <div>
              <div className="bg-white border rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Input placeholder="Rechercher par matricule, service, clinique..." value={searchTerm} onChange={(e: any) => { setSearchTerm(e.target.value); setPageIndex(0); }} />
                  <Select value={filterStatusSelect} onValueChange={(v: any) => { setFilterStatusSelect(v); setPageIndex(0); }}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="online">En ligne</SelectItem>
                      <SelectItem value="offline">Hors ligne</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterFamily} onValueChange={(v: any) => { setFilterFamily(v); setPageIndex(0); }}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {familyOptions.map(f => (
                        <SelectItem key={f} value={f}>{f === 'all' ? 'Toutes familles' : f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={sortKey} onValueChange={(v: any) => setSortKey(v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matricule">Matricule</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="alerts">Alertes actives</SelectItem>
                      <SelectItem value="last_measure">Dernière mesure</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortDir} onValueChange={(v: any) => setSortDir(v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascendant</SelectItem>
                      <SelectItem value="desc">Descendant</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={String(pageSize)} onValueChange={(v: any) => { setPageSize(Number(v)); setPageIndex(0); }}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loadingSensors ? (
                  <div className="col-span-full flex justify-center items-center py-8 text-muted-foreground">Chargement des capteurs...</div>
                ) : sensorsPage.length === 0 ? (
                  <div className="col-span-full flex justify-center py-8 text-muted-foreground">Aucun capteur trouvé.</div>
                ) : (
                  sensorsPage.map(sensor => {
                    const sensorId = Number(sensor.id);
                    return (
                      <SensorCard
                        key={String(sensor.id)}
                        sensor={sensor}
                        showFullHierarchy={isFullCapteurs}
                        alertesCount={loadingAlertCounts ? undefined : alertesActiveMap[sensorId] ?? 0}
                        totalAlertes={loadingAlertCounts ? undefined : alertesTotalsMap[sensorId] ?? 0}
                        showEvolution
                        onShowChart={id => {
                          const s = sensors.find(x => String(x.id) === String(id)) || sensor;
                          setSelectedSensor(s as Sensor);
                          onShowSensorEvolution?.(id);
                        }}
                      />
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">{sortedSensors.length} capteurs — page {pageIndex + 1} / {totalPages}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPageIndex(p => Math.max(0, p - 1))} disabled={pageIndex === 0}>Précédent</Button>
                  <Button size="sm" onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))} disabled={pageIndex >= totalPages - 1}>Suivant</Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-6">
            {/* Filtre de temps pour les rapports */}
            <ChartTimeFilter 
              onPeriodChange={(period, start, end) => {
                if (period === 'custom' && start && end) {
                  setDateFrom(start.toISOString().split('T')[0]);
                  setDateTo(end.toISOString().split('T')[0]);
                  setChartPeriod('custom');
                } else {
                  setChartPeriod(period as PeriodOption);
                  setDateFrom(null);
                  setDateTo(null);
                }
              }}
            />

            {/* KPIs Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 shadow-lg" style={{ backgroundColor: '#3b82f6' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#e0f2fe' }}>Total Capteurs</p>
                    <h3 className="text-3xl font-bold mt-2" style={{ color: '#ffffff' }}>{sensors.length}</h3>
                    <p className="text-xs mt-1" style={{ color: '#e0f2fe' }}>
                      {sensors.filter(s => s.status === 'online').length} en ligne
                    </p>
                  </div>
                  <svg className="w-12 h-12 opacity-80" fill="none" stroke="#e0f2fe" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 shadow-lg" style={{ backgroundColor: '#10b981' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#d1fae5' }}>Capteurs Actifs</p>
                    <h3 className="text-3xl font-bold mt-2" style={{ color: '#ffffff' }}>
                      {sensors.filter(s => s.status === 'online').length}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: '#d1fae5' }}>
                      {sensors.length > 0 ? Math.round((sensors.filter(s => s.status === 'online').length / sensors.length) * 100) : 0}% du total
                    </p>
                  </div>
                  <svg className="w-12 h-12 opacity-80" fill="none" stroke="#d1fae5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 shadow-lg" style={{ backgroundColor: '#ef4444' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#fee2e2' }}>Alertes Actives</p>
                    <h3 className="text-3xl font-bold mt-2" style={{ color: '#ffffff' }}>
                      {alertes.filter((a: any) => 
                        String(a.statut || a.status || '').toLowerCase() === 'actif' ||
                        String(a.statut || a.status || '').toLowerCase() === 'active'
                      ).length}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: '#fee2e2' }}>
                      sur {alertes.length} total
                    </p>
                  </div>
                  <svg className="w-12 h-12 opacity-80" fill="none" stroke="#fee2e2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 shadow-lg" style={{ backgroundColor: '#8b5cf6' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#ede9fe' }}>Cliniques</p>
                    <h3 className="text-3xl font-bold mt-2" style={{ color: '#ffffff' }}>{clinicsData.length}</h3>
                    <p className="text-xs mt-1" style={{ color: '#ede9fe' }}>
                      {clinicsData.filter((c: any) => c.alertesActives > 0).length} avec alertes
                    </p>
                  </div>
                  <svg className="w-12 h-12 opacity-80" fill="none" stroke="#ede9fe" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Status Distribution - Pie Chart */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Répartition des Capteurs</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'En ligne', value: sensors.filter(s => s.status === 'online').length, color: '#10b981' },
                        { name: 'Hors ligne', value: sensors.filter(s => s.status === 'offline').length, color: '#ef4444' },
                        { name: 'Inconnu', value: sensors.length - sensors.filter(s => s.status === 'online').length - sensors.filter(s => s.status === 'offline').length, color: '#94a3b8' }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'En ligne', value: sensors.filter(s => s.status === 'online').length, color: '#10b981' },
                        { name: 'Hors ligne', value: sensors.filter(s => s.status === 'offline').length, color: '#ef4444' },
                        { name: 'Inconnu', value: sensors.length - sensors.filter(s => s.status === 'online').length - sensors.filter(s => s.status === 'offline').length, color: '#94a3b8' }
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Alert Types Distribution - Bar Chart */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Types d'Alertes</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={(() => {
                      const alertTypes = alertes.reduce((acc: any, a: any) => {
                        const type = a.type || 'Inconnue';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                      }, {});

                      return Object.entries(alertTypes).map(([type, count]) => ({
                        type,
                        count,
                        actif: alertes.filter((a: any) => 
                          a.type === type && 
                          (String(a.statut || a.status || '').toLowerCase() === 'actif' ||
                           String(a.statut || a.status || '').toLowerCase() === 'active')
                        ).length
                      }));
                    })()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="actif" fill="#ef4444" name="Actives" />
                    <Bar dataKey="count" fill="#94a3b8" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Sensors by Family - Horizontal Bar Chart */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Capteurs par Famille</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={(() => {
                      const families = sensors.reduce((acc: any, s: any) => {
                        const fam = s.famille?.famille || 'Sans famille';
                        acc[fam] = (acc[fam] || 0) + 1;
                        return acc;
                      }, {});

                      return Object.entries(families)
                        .map(([famille, count]) => ({ famille, count }))
                        .sort((a: any, b: any) => b.count - a.count)
                        .slice(0, 8);
                    })()}
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="famille" type="category" width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* System Health - Radial Chart */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">État du Système</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                    data={[
                      {
                        name: 'Disponibilité',
                        value: sensors.length > 0 ? Math.round((sensors.filter(s => s.status === 'online').length / sensors.length) * 100) : 0,
                        fill: sensors.length > 0 && (sensors.filter(s => s.status === 'online').length / sensors.length) > 0.8 ? '#10b981' : sensors.length > 0 && (sensors.filter(s => s.status === 'online').length / sensors.length) > 0.5 ? '#f59e0b' : '#ef4444'
                      }
                    ]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                    />
                    <Legend
                      iconSize={10}
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      formatter={(value, entry: any) => `${entry.payload.value}% ${value}`}
                    />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-3xl font-bold fill-slate-900"
                    >
                      {sensors.length > 0 ? Math.round((sensors.filter(s => s.status === 'online').length / sensors.length) * 100) : 0}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 3 - Area Chart for Clinics */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Vue d'ensemble des Cliniques</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={clinicsData
                    .map((c: any) => ({
                      nom: c.nom?.length > 20 ? c.nom.substring(0, 18) + '...' : c.nom,
                      capteurs: c.totalCapteurs || 0,
                      enLigne: c.capteursEnLigne || 0,
                      alertes: c.alertesActives || 0
                    }))
                    .slice(0, 10)
                  }
                  margin={{ top: 10, right: 30, left: 10, bottom: 60 }}
                >
                  <defs>
                    <linearGradient id="colorCapteurs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEnLigne" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAlertes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nom" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="capteurs" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCapteurs)" name="Total Capteurs" />
                  <Area type="monotone" dataKey="enLigne" stroke="#10b981" fillOpacity={1} fill="url(#colorEnLigne)" name="En Ligne" />
                  <Area type="monotone" dataKey="alertes" stroke="#ef4444" fillOpacity={1} fill="url(#colorAlertes)" name="Alertes" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* System Health Status */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">État du Système</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Taux de disponibilité</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {sensors.length > 0 ? Math.round((sensors.filter(s => s.status === 'online').length / sensors.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    sensors.length > 0 && (sensors.filter(s => s.status === 'online').length / sensors.length) > 0.8
                      ? 'bg-green-100'
                      : sensors.length > 0 && (sensors.filter(s => s.status === 'online').length / sensors.length) > 0.5
                      ? 'bg-yellow-100'
                      : 'bg-red-100'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      sensors.length > 0 && (sensors.filter(s => s.status === 'online').length / sensors.length) > 0.8
                        ? 'text-green-600'
                        : sensors.length > 0 && (sensors.filter(s => s.status === 'online').length / sensors.length) > 0.5
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Alertes critiques</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {alertes.filter((a: any) => 
                        (String(a.statut || a.status || '').toLowerCase() === 'actif' ||
                        String(a.statut || a.status || '').toLowerCase() === 'active') &&
                        (a.critique === true || a.critique === 1)
                      ).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Capteurs avec alertes</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {Object.values(alertesActiveMap).filter((count: any) => count > 0).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Summary */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Résumé d'Activité Récente</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Capteurs récemment connectés</h4>
                  <div className="space-y-2">
                    {sensors
                      .filter((s: any) => s.date_derniere_connexion)
                      .sort((a: any, b: any) => {
                        const dateA = new Date(a.date_derniere_connexion).getTime();
                        const dateB = new Date(b.date_derniere_connexion).getTime();
                        return dateB - dateA;
                      })
                      .slice(0, 5)
                      .map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                          <span className="font-medium text-slate-900">{s.matricule}</span>
                          <span className="text-xs text-slate-600">
                            {new Date(s.date_derniere_connexion).toLocaleString('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ))}
                    {sensors.filter((s: any) => s.date_derniere_connexion).length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">Aucune connexion récente</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Alertes récentes</h4>
                  <div className="space-y-2">
                    {alertes
                      .sort((a: any, b: any) => {
                        const dateA = new Date(a.date || a.created_at).getTime();
                        const dateB = new Date(b.date || b.created_at).getTime();
                        return dateB - dateA;
                      })
                      .slice(0, 5)
                      .map((a: any, idx: number) => (
                        <div key={a.id || idx} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              String(a.statut || a.status || '').toLowerCase() === 'actif' ||
                              String(a.statut || a.status || '').toLowerCase() === 'active'
                                ? 'bg-red-500'
                                : 'bg-slate-400'
                            }`}></span>
                            <span className="font-medium text-slate-900">{a.type || 'Alerte'}</span>
                          </div>
                          <span className="text-xs text-slate-600">
                            {new Date(a.date || a.created_at).toLocaleString('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ))}
                    {alertes.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">Aucune alerte récente</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clinics">
          {clinicsLoading && !(clinicsData && clinicsData.length > 0) ? (
            <div className="text-center py-8 text-muted-foreground">Chargement des cliniques...</div>
          ) : (clinicsData && clinicsData.length > 0) ? (
            <div>
              <div className="bg-white border rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Input placeholder="Rechercher clinique par nom ou adresse..." value={clinicSearch} onChange={(e: any) => { setClinicSearch(e.target.value); setClinicPageIndex(0); }} />
                  <Select value={clinicFilterHasAlerts} onValueChange={(v: any) => { setClinicFilterHasAlerts(v); setClinicPageIndex(0); }}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="has">Avec alertes</SelectItem>
                      <SelectItem value="none">Sans alertes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={clinicSortKey} onValueChange={(v: any) => setClinicSortKey(v)}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nom</SelectItem>
                      <SelectItem value="capteursEnLigne">Capteurs en ligne</SelectItem>
                      <SelectItem value="alertesActive">Alertes actives</SelectItem>
                      <SelectItem value="totalAlertes">Total alertes</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={clinicSortDir} onValueChange={(v: any) => setClinicSortDir(v)}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Asc</SelectItem>
                      <SelectItem value="desc">Desc</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={String(clinicPageSize)} onValueChange={(v: any) => { setClinicPageSize(Number(v)); setClinicPageIndex(0); }}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ClinicOverview cliniquesData={clinicsPage} alertes={alertes} />

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">{sortedClinics.length} cliniques — page {clinicPageIndex + 1} / {clinicTotalPages}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setClinicPageIndex(p => Math.max(0, p - 1))} disabled={clinicPageIndex === 0}>Précédent</Button>
                  <Button size="sm" onClick={() => setClinicPageIndex(p => Math.min(clinicTotalPages - 1, p + 1))} disabled={clinicPageIndex >= clinicTotalPages - 1}>Suivant</Button>
                </div>
              </div>
            </div>
          ) : isFullCapteurs ? (
            <ClinicOverview capteurs={sensors as any} alertes={alertes} />
          ) : (
            <div className="text-muted-foreground">Aucune donnée clinique disponible.</div>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DashboardOverview;
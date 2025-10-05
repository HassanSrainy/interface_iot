import React, { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import SensorCard, { Sensor } from "./sensor-card";
import AlertsPanelUser from "./alerts-panel-user";
import ClinicOverview from "./clinic-overview";
import { getSensorsByUser } from "../sensors/sensor-api";
import { getAlertesByUser, Alerte } from "../alertes/alertes-api";
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
  user: { id: number; email: string };
  onShowSensorEvolution?: (sensorId: string | number) => void;
}

type PeriodOption = "1h" | "24h" | "7d" | "30d";

export function DashboardOverviewUser({
  user,
  onShowSensorEvolution,
}: DashboardOverviewUserProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [chartPeriod, setChartPeriod] = useState<PeriodOption>("1h");
  const [alertesTotalsMap, setAlertesTotalsMap] = useState<Record<number, number>>({});
  const [alertesActiveMap, setAlertesActiveMap] = useState<Record<number, number>>({});
  const [loadingSensors, setLoadingSensors] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [alertes, setAlertes] = useState<Alerte[]>([]);

  // Charger capteurs + alertes utilisateur
  const loadAll = useCallback(async () => {
    if (!user?.id) return;

    setLoadingSensors(true);
    try {
      // 1️⃣ récupérer capteurs utilisateur
      const rawSensors = await getSensorsByUser(user.id);
      setSensors(rawSensors);

      // 2️⃣ récupérer alertes utilisateur
      setLoadingCounts(true);
      try {
        const alertesData = await getAlertesByUser(user.id);
        setAlertes(alertesData || []);

        // 3️⃣ calcul des alertes par capteur
        const totals: Record<number, number> = {};
        const actives: Record<number, number> = {};
        rawSensors.forEach((s) => {
          const sAlertes = alertesData.filter(
            (a) => Number(a.capteur_id) === Number(s.id)
          );
          totals[s.id] = sAlertes.length;
          actives[s.id] = sAlertes.filter(
            (a) => a.statut?.toLowerCase() === "actif"
          ).length;
        });

        setAlertesTotalsMap(totals);
        setAlertesActiveMap(actives);
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

  // 🔍 Filtrer les mesures selon période
  const filterMeasuresByPeriod = (sensor: Sensor | null | undefined) => {
    if (!sensor?.mesures) return [];
    const now = new Date();
    let startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
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
    }
    return sensor.mesures
      .filter((m) => new Date(m.date_mesure) >= startDate)
      .map((m) => ({
        date: new Date(m.date_mesure).toLocaleString(),
        value: Number(m.valeur ?? 0),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const PERIODS: { key: PeriodOption; label: string }[] = [
    { key: "1h", label: "1h" },
    { key: "24h", label: "24h" },
    { key: "7d", label: "7j" },
    { key: "30d", label: "30j" },
  ];

  const totalActiveAlerts = alertes.filter(
    (a) => a.statut?.toLowerCase() === "actif"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Vue d'ensemble utilisateur</h2>
        <p className="text-muted-foreground">
          Vos capteurs et alertes en temps réel
        </p>
      </div>

      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evolution">Évolution/Capteur</TabsTrigger>
          <TabsTrigger value="clinics">Cliniques</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        {/* 📈 Évolution capteurs */}
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

                <div className="flex space-x-2">
                  {PERIODS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setChartPeriod(key)}
                      aria-pressed={chartPeriod === key}
                      className={`px-3 py-1 rounded-full text-sm ${
                        chartPeriod === key
                          ? "border-2 border-black bg-white shadow-sm"
                          : "border border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold">
                  Graphique — {selectedSensor?.matricule ?? `#${selectedSensor?.id}`}
                </h4>
                {filterMeasuresByPeriod(selectedSensor).length === 0 ? (
                  <div className="text-muted-foreground">
                    Aucune mesure disponible pour ce capteur.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filterMeasuresByPeriod(selectedSensor)}>
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
                          label="Seuil max"
                        />
                      )}
                      {selectedSensor?.seuil_min != null && (
                        <ReferenceLine
                          y={selectedSensor.seuil_min}
                          stroke="green"
                          strokeDasharray="4 4"
                          label="Seuil min"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingSensors ? (
                <div className="col-span-full flex justify-center py-8 text-muted-foreground">
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
                    alertesCount={
                      loadingCounts
                        ? undefined
                        : alertesActiveMap[Number(sensor.id)] ?? 0
                    }
                    totalAlertes={
                      loadingCounts
                        ? undefined
                        : alertesTotalsMap[Number(sensor.id)] ?? 0
                    }
                    showEvolution
                    onShowChart={(id) => {
                      const s =
                        sensors.find((x) => String(x.id) === String(id)) ||
                        sensor;
                      setSelectedSensor(s as Sensor);
                      onShowSensorEvolution?.(id);
                    }}
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* 🏥 Vue cliniques */}
        <TabsContent value="clinics">
          <ClinicOverview capteurs={sensors as any} alertes={alertes} />
        </TabsContent>

        {/* 🚨 Alertes utilisateur */}
        <TabsContent value="alerts">
          <AlertsPanelUser user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DashboardOverviewUser;

import React, { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SensorCard, Sensor } from "./sensor-card";
import { AlertsPanel } from "./alerts-panel";
import { ClinicOverview } from "./clinic-overview";
import { getSensors } from "../sensors/sensor-api";

// Charting
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DashboardOverviewProps {
  sensors?: Sensor[];
  alertes?: any[];
  onResolveAlert?: (alerteId: string) => void;
  onIgnoreAlert?: (alerteId: string) => void;
  onShowSensorEvolution?: (sensorId: string | number) => void;
}

export function DashboardOverview({
  sensors: propsSensors = [],
  alertes = [],
  onResolveAlert,
  onIgnoreAlert,
  onShowSensorEvolution,
}: DashboardOverviewProps) {
  const [sensors, setSensors] = useState<Sensor[]>(Array.isArray(propsSensors) ? propsSensors : []);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

  const isFullCapteurs = sensors.length > 0 && "famille" in sensors[0];

  const loadAll = useCallback(async () => {
    try {
      if (!propsSensors || propsSensors.length === 0) {
        const s = await getSensors();
        const normalizedSensors = (s || []).map(sensor => ({
          ...sensor,
          status: sensor.status === null ? undefined : sensor.status,
        }));
        setSensors(normalizedSensors);
      } else {
        setSensors(propsSensors);
      }
    } catch (err) {
      console.error("Erreur loadAll:", err);
    }
  }, [propsSensors]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (Array.isArray(propsSensors) && propsSensors.length > 0) {
      setSensors(propsSensors);
    }
  }, [propsSensors]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Vue d'ensemble</h2>
        <p className="text-muted-foreground">Aperçu de vos capteurs IoT et données en temps réel</p>
      </div>

      <Tabs defaultValue="evolution" className="space-y-4">
        <div className="mb-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="evolution">Évolution/Capteur</TabsTrigger>
            <TabsTrigger value="clinics">Cliniques</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="evolution">
          {selectedSensor ? (
            <div className="space-y-4">
              <button onClick={() => setSelectedSensor(null)} className="text-sm underline">
                ← Retour aux cartes
              </button>
              <SensorChart sensor={selectedSensor} onBack={() => setSelectedSensor(null)} />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sensors.map(sensor => {
                const sensorAlertes = Array.isArray(alertes)
                  ? alertes.filter(a => a.capteur_id === sensor.id && a.statut === "active")
                  : [];
                return (
                  <SensorCard
                    key={String(sensor.id)}
                    sensor={sensor}
                    showFullHierarchy={isFullCapteurs}
                    alertesCount={sensorAlertes.length}
                    showEvolution
                    onShowChart={id => {
                      const s = sensors.find(x => String(x.id) === String(id)) || sensor;
                      setSelectedSensor(s as Sensor);
                      onShowSensorEvolution?.(id);
                    }}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clinics">
          {isFullCapteurs ? (
            <ClinicOverview capteurs={sensors as any} alertes={alertes} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Vue cliniques disponible uniquement avec le modèle de données complet
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsPanel alertes={alertes} onResolveAlert={onResolveAlert} onIgnoreAlert={onIgnoreAlert} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------ SensorChart simple (self-contained) ------------------------ */
interface SensorChartProps {
  sensor: Sensor;
  onBack?: () => void;
}

export function SensorChart({ sensor, onBack }: SensorChartProps) {
  const data = Array.isArray(sensor?.mesures)
    ? sensor.mesures
        .map((m: any) => ({
          date: m.date_mesure ? new Date(m.date_mesure).toLocaleString() : String(m.id ?? ""),
          value: typeof m.valeur === "number" ? m.valeur : Number(m.valeur || 0),
        }))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-lg font-semibold">Graphique — {sensor.matricule ?? `#${sensor.id}`}</h4>
        </div>
        {onBack && <button onClick={onBack} className="text-sm underline">Retour</button>}
      </div>

      {data.length === 0 ? (
        <div className="text-muted-foreground">Aucune mesure disponible pour ce capteur.</div>
      ) : (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default DashboardOverview;

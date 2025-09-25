import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SensorCard, Sensor } from "./sensor-card";
import { ClinicOverview } from "./clinic-overview";
import { AlertsPanel } from "./alerts-panel";
import { CapteurWithRelations, Alerte } from "../../types/domain";

/* ---- APIs (helpers existants) ----
   Ajuste les chemins si ta structure diffère :
   - depuis /components/dashboard vers /components/sensors => ../sensors/...
   - familles, cliniques, floors, services sont supposés au même niveau /components/*
*/
import {
  getSensors,
  createSensor,
  updateSensor,
  deleteSensor,
} from "../sensors/sensor-api";
import { getFamilies } from "../familles/familles-api";
import { getCliniques } from "../cliniques/cliniques-api";
import { getFloors, getFloorsByClinique } from "../floors/floors-api";
import { getServices, getServicesByFloor } from "../services/services-api";

interface DashboardOverviewProps {
  sensors?: Sensor[] | CapteurWithRelations[]; // optional: si fourni on l'utilise
  alertes?: Alerte[];
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
  // local state (on utilisera propsSensors si présent, sinon fetch)
  const [sensors, setSensors] = useState<any[]>(Array.isArray(propsSensors) ? propsSensors : []);
  const [families, setFamilies] = useState<any[]>([]);
  const [cliniques, setCliniques] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isFullCapteurs = sensors.length > 0 && "famille" in sensors[0];

  const loadAll = useCallback(async (forceFetchSensors = false) => {
    setLoading(true);
    setError(null);

    try {
      // 1) sensors: si props fournie et non vide et pas de forceFetch -> on garde
      if (!Array.isArray(propsSensors) || propsSensors.length === 0 || forceFetchSensors) {
        const s = await getSensors();
        setSensors(s || []);
      } else {
        setSensors(propsSensors as any[]);
      }

      // 2) familles
      try {
        const f = await getFamilies();
        setFamilies(f || []);
      } catch (err) {
        console.warn("Erreur getFamilies:", err);
        setFamilies([]);
      }

      // 3) cliniques
      try {
        const c = await getCliniques();
        setCliniques(c || []);
      } catch (err) {
        console.warn("Erreur getCliniques:", err);
        setCliniques([]);
      }

      // 4) floors (optionnel: on récupère tous)
      try {
        const fl = await getFloors();
        setFloors(fl || []);
      } catch (err) {
        console.warn("Erreur getFloors:", err);
        setFloors([]);
      }

      // 5) services
      try {
        const sv = await getServices();
        setServices(sv || []);
      } catch (err) {
        console.warn("Erreur getServices:", err);
        setServices([]);
      }
    } catch (err: any) {
      console.error("Erreur loadAll:", err);
      setError(err?.message ?? "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [propsSensors]);

  useEffect(() => {
    // load on mount
    loadAll(false);
    // si propsSensors change et contient des éléments, on l'utilise
  }, [loadAll]);

  useEffect(() => {
    if (Array.isArray(propsSensors) && propsSensors.length > 0) {
      setSensors(propsSensors as any[]);
    }
  }, [propsSensors]);

  const handleRefresh = async () => {
    await loadAll(true);
  };

  // helper pour count alertes actives
  const activeAlertCount = alertes.filter(a => a.statut === "active").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Chargement des données...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600">Erreur: {error}</div>
        <button onClick={handleRefresh} className="mt-2 underline">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Vue d'ensemble</h2>
        <p className="text-muted-foreground">
          Aperçu de vos capteurs IoT et données en temps réel
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Données chargées: {sensors.length} capteurs</div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-muted-foreground">Alertes actives: {activeAlertCount}</div>
          <button
            className="text-sm underline"
            onClick={handleRefresh}
            title="Rafraîchir données (capteurs, familles, cliniques, floors, services)"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evolution">Évolution/Capteur</TabsTrigger>
          <TabsTrigger value="clinics">Cliniques</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution">
          <div>
            <h3 className="mb-4 text-lg font-medium">Évolution par Capteur</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sensors.map((sensor) => {
                const sensorAlertes = alertes.filter(
                  (a) => a.capteur_id === sensor.id && a.statut === "active"
                );
                return (
                  <SensorCard
                    key={String(sensor.id)}
                    sensor={sensor}
                    showFullHierarchy={isFullCapteurs}
                    alertesCount={sensorAlertes.length}
                    showEvolution
                    onShowChart={onShowSensorEvolution}
                  />
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clinics">
          {isFullCapteurs ? (
            <ClinicOverview
              capteurs={sensors as CapteurWithRelations[]}
              alertes={alertes}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Vue cliniques disponible uniquement avec le modèle de données complet
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsPanel
            alertes={alertes}
            onResolveAlert={onResolveAlert}
            onIgnoreAlert={onIgnoreAlert}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

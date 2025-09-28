// frontend3/src/components/dashboard/sensor-card.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Wifi,
  WifiOff,
  Building,
  MapPin,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

export interface Sensor {
  id: number;
  matricule: string;
  status?: "online" | "offline" | null;
  seuil_min?: number | null;
  seuil_max?: number | null;
  famille?: any | null;
  service?: any | null;
  mesures?: any[];
  derniere_mesure?: { id?: number; valeur: number; date_mesure: string } | null;
}

interface SensorCardProps {
  sensor: Sensor | any;
  showFullHierarchy?: boolean;
  alertesCount?: number; // active_alertes
  totalAlertes?: number; // total_alertes
  showEvolution?: boolean;
  onShowChart?: (sensorId: number | string) => void;
}

const getIcon = (familleOrType?: any) => {
  const type = typeof familleOrType === "string" ? familleOrType : familleOrType?.type?.type;
  switch (type) {
    case "temperature": return <Thermometer className="h-4 w-4" />;
    case "humidity": return <Droplets className="h-4 w-4" />;
    case "pressure": return <Wind className="h-4 w-4" />;
    case "battery": return <Zap className="h-4 w-4" />;
    default: return <Thermometer className="h-4 w-4" />;
  }
};

const isOnline = (sensor: Sensor) => {
  if (!sensor?.status) return false;
  const s = String(sensor.status).toLowerCase().trim();
  return s === "online";
};

const formatDate = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString();
};

export function SensorCard({
  sensor,
  showFullHierarchy = false,
  alertesCount = 0,
  totalAlertes = 0,
  showEvolution = false,
  onShowChart,
}: SensorCardProps) {
  const isFullCapteur = !!sensor?.famille;
  const online = isOnline(sensor);

  const value = sensor?.derniere_mesure?.valeur ?? sensor?.mesures?.[0]?.valeur ?? 0;
  const unit = sensor?.famille?.unite ?? sensor?.unite ?? "";

  const seuilMin = sensor?.seuil_min ?? null;
  const seuilMax = sensor?.seuil_max ?? null;

  const getThresholdProgress = (): number => {
    if (seuilMin == null || seuilMax == null) return 50;
    const range = seuilMax - seuilMin;
    if (range === 0) return 0;
    const position = (value - seuilMin) / range;
    return Math.max(0, Math.min(100, position * 100));
  };

  const getThresholdColorClass = () => {
    if (seuilMin == null || seuilMax == null) return "bg-blue-500";
    if (value < seuilMin || value > seuilMax) return "bg-red-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col">
          <CardTitle className="text-sm font-medium">
            {sensor?.matricule ?? `Capteur ${String(sensor?.id ?? "")}`}
          </CardTitle>

          {isFullCapteur && showFullHierarchy && sensor?.service && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Building className="h-3 w-3 mr-1" />
              <span>{sensor?.service?.floor?.clinique?.nom ?? "Clinique"}</span>
              <span className="mx-1">•</span>
              <MapPin className="h-3 w-3 mr-1" />
              <span>{sensor?.service?.floor?.nom ?? ""} - {sensor?.service?.nom ?? ""}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {getIcon(sensor?.famille ?? sensor?.type)}
          {online ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">
          {value}{unit}
        </div>

        {seuilMin != null && seuilMax != null && (
          <div className="space-y-2 mt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{seuilMin}{unit}</span>
                <span>Valeur actuelle</span>
                <span>{seuilMax}{unit}</span>
              </div>

              <div className="relative">
                <Progress value={100} className="h-2 bg-gray-200" />
                <div
                  className={`absolute top-0 h-2 rounded-full ${getThresholdColorClass()}`}
                  style={{ left: `${getThresholdProgress()}%`, width: "4px", transform: "translateX(-50%)" }}
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              {sensor?.matricule && <div>Matricule: {sensor.matricule}</div>}
              {isFullCapteur && <div>Type: {sensor.famille?.type?.type ?? sensor.famille?.famille}</div>}
              {sensor?.adresse_ip && <div>IP: {sensor.adresse_ip}</div>}
              {sensor?.adresse_mac && <div>MAC: {sensor.adresse_mac}</div>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Badge variant={online ? "default" : "destructive"} className="text-xs">
              {online ? "En ligne" : "Hors ligne"}
            </Badge>

            {/* badge alertes actives */}
            {alertesCount > 0 && (
              <Badge variant="destructive" className="text-xs flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {alertesCount}
              </Badge>
            )}

            {/* total alertes (info) */}
            <div className="text-xs text-muted-foreground ml-2">
              Total: <span className="font-medium">{totalAlertes ?? 0}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {sensor?.service?.nom ?? sensor?.location ?? "—"}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Mis à jour: {formatDate(sensor?.derniere_mesure?.date_mesure ?? sensor?.date_derniere_connexion)}
          </p>

          {showEvolution && (
            <Button size="sm" variant="outline" onClick={() => onShowChart?.(sensor?.id ?? "")} className="h-6 px-2 text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Graphique
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SensorCard;

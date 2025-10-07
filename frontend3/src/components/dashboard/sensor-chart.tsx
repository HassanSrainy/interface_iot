import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Sensor } from "./sensor-card";
import { subHours, subDays, format } from "date-fns";

interface SensorChartProps {
  sensor: Sensor;
  unit?: string;
  color?: string;
}

type Period = "1h" | "24h" | "7d" | "30d" | "custom";

/** Parser robuste local (seconds | ms | ISO | "YYYY-MM-DD HH:mm:ss") */
function parseDateMesureLocal(raw: unknown): Date | null {
  if (raw == null) return null;
  if (raw instanceof Date) return raw;

  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber)) {
    const s = String(raw).trim();
    if (/^\d{10}$/.test(s)) return new Date(asNumber * 1000); // seconds -> ms
    return new Date(asNumber); // assume ms
  }

  const str = String(raw).trim();
  // try native parse (ISO)
  const d1 = new Date(str);
  if (!isNaN(d1.getTime())) return d1;

  // try "YYYY-MM-DD HH:mm..." -> replace space with T
  const d2 = new Date(str.replace(" ", "T"));
  if (!isNaN(d2.getTime())) return d2;

  // fallback: remove trailing fractions
  try {
    const cleaned = str.replace(/(\.\d+)?$/, "");
    const d3 = new Date(cleaned);
    if (!isNaN(d3.getTime())) return d3;
  } catch {
    /* noop */
  }

  return null;
}

export function SensorChart({ sensor, unit = "", color = "#3b82f6" }: SensorChartProps) {
  const [period, setPeriod] = useState<Period>("1h");
  const [customRange, setCustomRange] = useState<{ start?: string; end?: string }>({});

  // Filtrage des mesures selon la période (robuste)
  const filteredData = useMemo(() => {
    if (!sensor?.mesures || sensor.mesures.length === 0) return [];

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case "1h":
        startDate = subHours(now, 1);
        break;
      case "24h":
        startDate = subHours(now, 24);
        break;
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "custom":
        startDate = customRange.start ? new Date(customRange.start) : subDays(now, 30);
        endDate = customRange.end ? new Date(customRange.end) : now;
        break;
      default:
        startDate = subHours(now, 1);
    }

    const startTs = startDate.getTime();
    const endTs = endDate.getTime();

    const mapped = sensor.mesures
      .map((m: any) => {
        const d = parseDateMesureLocal(m.date_mesure);
        if (!d) return null;
        const ts = d.getTime();
        return {
          ts,
          timeLabel: format(d, "yyyy-MM-dd HH:mm"),
          value: Number(m.valeur ?? 0),
        };
      })
      .filter(Boolean)
      // comparaisons inclusives : >= start && <= end
      .filter((d: any) => d.ts >= startTs && d.ts <= endTs)
      .sort((a: any, b: any) => a.ts - b.ts)
      .map((d: any) => ({ time: d.timeLabel, value: d.value }));

    return mapped;
  }, [sensor, period, customRange]);

  // Guard pour minY / maxY si filteredData vide
  const values = filteredData.map((d) => d.value);
  const hasValues = values.length > 0;

  const minY = hasValues
    ? sensor.seuil_min != null
      ? Math.min(sensor.seuil_min, ...values)
      : Math.min(...values)
    : sensor.seuil_min != null
    ? sensor.seuil_min
    : 0;

  const maxY = hasValues
    ? sensor.seuil_max != null
      ? Math.max(sensor.seuil_max, ...values)
      : Math.max(...values)
    : sensor.seuil_max != null
    ? sensor.seuil_max
    : 1;

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center">
        <CardTitle>{sensor.matricule ?? `Capteur #${sensor.id}`}</CardTitle>
        <div className="space-x-2 mt-2 md:mt-0">
          <button onClick={() => setPeriod("1h")}>1h</button>
          <button onClick={() => setPeriod("24h")}>24h</button>
          <button onClick={() => setPeriod("7d")}>7j</button>
          <button onClick={() => setPeriod("30d")}>30j</button>
          <button onClick={() => setPeriod("custom")}>Personnalisé</button>
        </div>
        <CardDescription>
          {period === "custom" && (
            <span className="ml-2 text-sm text-muted-foreground">
              {customRange.start} → {customRange.end}
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="h-[250px]">
          {filteredData.length === 0 ? (
            <div className="text-muted-foreground">Aucune mesure disponible pour cette période.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis domain={[minY, maxY]} tickFormatter={(v) => `${v}${unit}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0];
                      return (
                        <div className="bg-background p-3 border rounded-lg shadow-sm">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-sm">{`${p?.value ?? "—"}${unit}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const value = payload?.value ?? null;
                    const outOfRange =
                      (sensor.seuil_max != null && value != null && value > sensor.seuil_max) ||
                      (sensor.seuil_min != null && value != null && value < sensor.seuil_min);
                    return <circle cx={cx} cy={cy} r={3} fill={outOfRange ? "red" : color} strokeWidth={2} />;
                  }}
                  activeDot={{ r: 5, stroke: color }}
                />

                {sensor.seuil_max != null && (
                  <ReferenceLine y={sensor.seuil_max} stroke="red" strokeDasharray="4 4" label="Seuil max" />
                )}
                {sensor.seuil_min != null && (
                  <ReferenceLine y={sensor.seuil_min} stroke="green" strokeDasharray="4 4" label="Seuil min" />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {period === "custom" && (
          <div className="mt-4 flex space-x-2">
            <input
              type="date"
              value={customRange.start || ""}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
            />
            <input
              type="date"
              value={customRange.end || ""}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { SensorCard, Sensor } from "./sensor-card"
import { SensorChart } from "./sensor-chart"
import { ClinicOverview } from "./clinic-overview"
import { AlertsPanel } from "./alerts-panel"
import { Activity, Thermometer, Droplets, Zap } from "lucide-react"
import { CapteurWithRelations, Alerte } from "../../types/domain"

interface DashboardOverviewProps {
  sensors: Sensor[] | CapteurWithRelations[]
  alertes?: Alerte[]
  onResolveAlert?: (alerteId: string) => void
  onIgnoreAlert?: (alerteId: string) => void
  onShowSensorEvolution?: (sensorId: string) => void
}

export function DashboardOverview({ sensors, alertes = [], onResolveAlert, onIgnoreAlert, onShowSensorEvolution }: DashboardOverviewProps) {
  const sensorsOnline = sensors.filter(s => s.status === 'online').length
  const avgTemperature = sensors
    .filter(s => s.type === 'temperature' && s.status === 'online')
    .reduce((acc, s, _, arr) => acc + s.value / arr.length, 0)
  const avgHumidity = sensors
    .filter(s => s.type === 'humidity' && s.status === 'online')
    .reduce((acc, s, _, arr) => acc + s.value / arr.length, 0)
  const avgBattery = sensors
    .filter(s => s.type === 'battery' && s.status === 'online')
    .reduce((acc, s, _, arr) => acc + s.value / arr.length, 0)

  // Mock historical data for charts
  const temperatureData = [
    { time: '00:00', value: 22 },
    { time: '04:00', value: 21 },
    { time: '08:00', value: 23 },
    { time: '12:00', value: 25 },
    { time: '16:00', value: 24 },
    { time: '20:00', value: 23 },
  ]

  const humidityData = [
    { time: '00:00', value: 65 },
    { time: '04:00', value: 68 },
    { time: '08:00', value: 62 },
    { time: '12:00', value: 58 },
    { time: '16:00', value: 60 },
    { time: '20:00', value: 63 },
  ]

  const isFullCapteurs = sensors.length > 0 && 'famille' in sensors[0]

  return (
    <div className="space-y-6">
      <div>
        <h2>Vue d'ensemble</h2>
        <p className="text-muted-foreground">
          Aperçu de vos capteurs IoT et données en temps réel
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Capteurs Actifs</TabsTrigger>
          <TabsTrigger value="clinics">Cliniques</TabsTrigger>
          <TabsTrigger value="evolution">Évolution/Capteur</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capteurs Actifs</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sensorsOnline}</div>
                <p className="text-xs text-muted-foreground">
                  sur {sensors.length} capteurs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Température Moy.</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgTemperature.toFixed(1)}°C</div>
                <p className="text-xs text-muted-foreground">
                  +2°C depuis hier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Humidité Moy.</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgHumidity.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  -5% depuis hier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Batterie Moy.</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgBattery.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">
                  Autonomie bonne
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <SensorChart
              title="Température"
              description="Évolution des températures sur les dernières 24h"
              data={temperatureData}
              unit="°C"
              color="#ef4444"
            />
            <SensorChart
              title="Humidité"
              description="Évolution de l'humidité sur les dernières 24h"
              data={humidityData}
              unit="%"
              color="#3b82f6"
            />
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

        <TabsContent value="evolution">
          <div>
            <h3 className="mb-4">Évolution par Capteur</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sensors.map((sensor) => {
                const sensorAlertes = alertes.filter(a => a.capteur_id === sensor.id && a.statut === 'active')
                return (
                  <SensorCard 
                    key={sensor.id} 
                    sensor={sensor} 
                    showFullHierarchy={isFullCapteurs}
                    alertesCount={sensorAlertes.length}
                    showEvolution={true}
                    onShowChart={onShowSensorEvolution}
                  />
                )
              })}
            </div>
          </div>
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
  )
}
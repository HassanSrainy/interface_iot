import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { Thermometer, Droplets, Wind, Zap, Wifi, WifiOff, Building, MapPin, AlertTriangle, BarChart3 } from "lucide-react"
import { CapteurWithRelations } from "../../types/domain"

export interface Sensor {
  id: string
  name: string
  type: 'temperature' | 'humidity' | 'pressure' | 'battery'
  value: number
  unit: string
  status: 'online' | 'offline'
  lastUpdate: string
  location: string
}

interface SensorCardProps {
  sensor: Sensor | CapteurWithRelations
  showFullHierarchy?: boolean
  alertesCount?: number
  showEvolution?: boolean
  onShowChart?: (sensorId: string) => void
}

const getIcon = (type: string) => {
  switch (type) {
    case 'temperature':
      return <Thermometer className="h-4 w-4" />
    case 'humidity':
      return <Droplets className="h-4 w-4" />
    case 'pressure':
      return <Wind className="h-4 w-4" />
    case 'battery':
      return <Zap className="h-4 w-4" />
    default:
      return <Thermometer className="h-4 w-4" />
  }
}

const getStatusColor = (status: string) => {
  return status === 'online' ? 'bg-green-500' : 'bg-red-500'
}

export function SensorCard({ 
  sensor, 
  showFullHierarchy = false, 
  alertesCount = 0,
  showEvolution = false,
  onShowChart
}: SensorCardProps) {
  const isFullCapteur = 'famille' in sensor
  
  // Calculer le pourcentage par rapport aux seuils pour l'affichage visuel
  const getThresholdProgress = () => {
    if (!isFullCapteur) return 50
    const range = sensor.seuil_max - sensor.seuil_min
    const position = sensor.value - sensor.seuil_min
    return Math.max(0, Math.min(100, (position / range) * 100))
  }
  
  const getThresholdColor = () => {
    if (!isFullCapteur) return 'bg-blue-500'
    if (sensor.value < sensor.seuil_min || sensor.value > sensor.seuil_max) {
      return 'bg-red-500'
    }
    return 'bg-green-500'
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col">
          <CardTitle className="text-sm font-medium">
            {sensor.name}
          </CardTitle>
          {isFullCapteur && showFullHierarchy && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Building className="h-3 w-3 mr-1" />
              <span>{sensor.service.floor.clinique.nom}</span>
              <span className="mx-1">•</span>
              <MapPin className="h-3 w-3 mr-1" />
              <span>{sensor.service.floor.nom} - {sensor.service.nom}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {getIcon(sensor.type)}
          {sensor.status === 'online' ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {sensor.value}{sensor.unit}
        </div>
        
        {isFullCapteur && (
          <div className="space-y-2 mt-2">
            {/* Affichage visuel des seuils */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{sensor.seuil_min}{sensor.unit}</span>
                <span>Valeur actuelle</span>
                <span>{sensor.seuil_max}{sensor.unit}</span>
              </div>
              <div className="relative">
                <Progress value={100} className="h-2 bg-gray-200" />
                <div 
                  className={`absolute top-0 h-2 rounded-full ${getThresholdColor()}`}
                  style={{ 
                    left: `${getThresholdProgress()}%`, 
                    width: '4px',
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Matricule: {sensor.matricule}</div>
              <div>Type: {sensor.famille.type.type} / {sensor.famille.famille}</div>
              <div>IP: {sensor.adresse_ip}</div>
              <div>MAC: {sensor.adresse_mac}</div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Badge 
              variant={sensor.status === 'online' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {sensor.status === 'online' ? 'En ligne' : 'Hors ligne'}
            </Badge>
            {alertesCount > 0 && (
              <Badge variant="destructive" className="text-xs flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {alertesCount}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {sensor.location}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Mis à jour: {sensor.lastUpdate}
          </p>
          {showEvolution && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onShowChart?.(sensor.id)}
              className="h-6 px-2 text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Graphique
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
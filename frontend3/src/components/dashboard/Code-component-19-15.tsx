import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { CalendarIcon, ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CapteurWithRelations, Alerte } from '../../types/domain'

interface SensorEvolutionProps {
  capteur: CapteurWithRelations
  alertes: Alerte[]
  onClose: () => void
}

// Mock data generator pour les données historiques
const generateHistoricalData = (capteur: CapteurWithRelations, days: number) => {
  const data = []
  const now = new Date()
  const intervalHours = days <= 1 ? 1 : days <= 7 ? 6 : 24

  for (let i = days * 24; i >= 0; i -= intervalHours) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000)
    
    // Simuler des variations réalistes
    let baseValue = capteur.value
    const noise = (Math.random() - 0.5) * 2
    const trend = Math.sin((i / (days * 24)) * Math.PI * 2) * 0.5
    let value = baseValue + noise + trend
    
    // Parfois générer des valeurs hors seuils pour créer des alertes
    if (Math.random() < 0.05) {
      value = Math.random() < 0.5 ? capteur.seuil_min - 1 : capteur.seuil_max + 1
    }
    
    value = Math.max(0, value)

    data.push({
      time: format(date, days <= 1 ? 'HH:mm' : days <= 7 ? 'dd/MM HH:mm' : 'dd/MM', { locale: fr }),
      fullDate: date,
      value: Math.round(value * 10) / 10,
      isAlert: value < capteur.seuil_min || value > capteur.seuil_max
    })
  }
  
  return data.reverse()
}

const PERIOD_OPTIONS = [
  { value: '1', label: 'Dernières 24h' },
  { value: '7', label: 'Derniers 7 jours' },
  { value: '30', label: 'Derniers 30 jours' },
  { value: 'custom', label: 'Période personnalisée' }
]

export function SensorEvolution({ capteur, alertes, onClose }: SensorEvolutionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7')
  const [customDate, setCustomDate] = useState<Date>()
  const [showCustomCalendar, setShowCustomCalendar] = useState(false)

  const isCustomPeriod = selectedPeriod === 'custom'
  const days = isCustomPeriod && customDate
    ? Math.ceil((new Date().getTime() - customDate.getTime()) / (1000 * 60 * 60 * 24))
    : parseInt(selectedPeriod)

  const historicalData = generateHistoricalData(capteur, days)
  const capteurAlertes = alertes.filter(a => a.capteur_id === capteur.id)
  const alertesActives = capteurAlertes.filter(a => a.statut === 'active')

  // Calculs des statistiques
  const values = historicalData.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length
  const currentValue = capteur.value
  const previousValue = historicalData[historicalData.length - 2]?.value || currentValue
  const trend = currentValue > previousValue ? 'up' : currentValue < previousValue ? 'down' : 'stable'

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500'
      case 'down': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h3>Évolution du capteur {capteur.name}</h3>
            <p className="text-sm text-muted-foreground">
              {capteur.service.floor.clinique.nom} - {capteur.service.floor.nom} - {capteur.service.nom}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {alertesActives.length > 0 && (
            <Badge variant="destructive" className="flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {alertesActives.length} alerte{alertesActives.length > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant={capteur.status === 'online' ? 'default' : 'destructive'}>
            {capteur.status === 'online' ? 'En ligne' : 'Hors ligne'}
          </Badge>
        </div>
      </div>

      {/* Contrôles de période */}
      <div className="flex items-center space-x-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isCustomPeriod && (
          <Popover open={showCustomCalendar} onOpenChange={setShowCustomCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-48">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customDate ? format(customDate, 'dd/MM/yyyy', { locale: fr }) : 'Sélectionner une date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customDate}
                onSelect={(date) => {
                  setCustomDate(date)
                  setShowCustomCalendar(false)
                }}
                disabled={(date) => date > new Date() || date < new Date('2023-01-01')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Actuelle</CardTitle>
            {getTrendIcon()}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentValue}{capteur.unit}</div>
            <p className={`text-xs ${getTrendColor()}`}>
              {trend === 'up' ? '+' : trend === 'down' ? '' : '±'}{Math.abs(currentValue - previousValue).toFixed(1)}{capteur.unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgValue.toFixed(1)}{capteur.unit}</div>
            <p className="text-xs text-muted-foreground">
              Sur la période sélectionnée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Min / Max</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{minValue.toFixed(1)} / {maxValue.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {capteur.unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capteurAlertes.length}</div>
            <p className="text-xs text-muted-foreground">
              {alertesActives.length} active{alertesActives.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique principal */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution temporelle</CardTitle>
          <CardDescription>
            Valeurs du capteur avec seuils de sécurité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  labelFormatter={(value, payload) => {
                    const data = payload?.[0]?.payload
                    return data?.fullDate ? format(new Date(data.fullDate), 'dd/MM/yyyy HH:mm', { locale: fr }) : value
                  }}
                  formatter={(value: number) => [`${value}${capteur.unit}`, 'Valeur']}
                />
                <Legend />
                
                {/* Seuils */}
                <ReferenceLine 
                  y={capteur.seuil_min} 
                  stroke="orange" 
                  strokeDasharray="5 5" 
                  label={{ value: `Seuil min: ${capteur.seuil_min}${capteur.unit}`, position: 'insideTopLeft' }}
                />
                <ReferenceLine 
                  y={capteur.seuil_max} 
                  stroke="red" 
                  strokeDasharray="5 5" 
                  label={{ value: `Seuil max: ${capteur.seuil_max}${capteur.unit}`, position: 'insideTopLeft' }}
                />
                
                {/* Ligne des valeurs */}
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={(props) => {
                    const { payload } = props
                    if (payload?.isAlert) {
                      return <circle {...props} fill="red" stroke="red" strokeWidth={2} r={4} />
                    }
                    return <circle {...props} fill="#3b82f6" stroke="#3b82f6" strokeWidth={2} r={2} />
                  }}
                  name="Valeur capteur"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Informations sur les seuils */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des seuils</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium">Zone normale</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Entre {capteur.seuil_min}{capteur.unit} et {capteur.seuil_max}{capteur.unit}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm font-medium">Seuil minimum</span>
              </div>
              <p className="text-sm text-muted-foreground">
                En dessous de {capteur.seuil_min}{capteur.unit}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm font-medium">Seuil maximum</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Au dessus de {capteur.seuil_max}{capteur.unit}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes récentes pour ce capteur */}
      {capteurAlertes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertes liées à ce capteur</CardTitle>
            <CardDescription>
              Historique des {capteurAlertes.length} dernières alertes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {capteurAlertes.slice(0, 5).map(alerte => (
                <div key={alerte.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">{alerte.type} — {alerte.valeur}{capteur.unit}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alerte.date ?? alerte.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      alerte.statut === 'active' ? 'destructive' : 
                      alerte.statut === 'resolue' ? 'default' : 'secondary'
                    }
                  >
                    {alerte.statut === 'active' ? 'Active' : 
                     alerte.statut === 'resolue' ? 'Résolue' : 'Ignorée'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
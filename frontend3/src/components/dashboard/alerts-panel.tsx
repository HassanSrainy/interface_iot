import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { AlertTriangle, CheckCircle, XCircle, Clock, Wifi, WifiOff } from "lucide-react"
import { Alerte } from "../../types/domain"

interface AlertsPanelProps {
  alertes: Alerte[]
  onResolveAlert?: (alerteId: string) => void
  onIgnoreAlert?: (alerteId: string) => void
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'deconnexion':
      return <WifiOff className="h-4 w-4" />
    case 'seuil_min':
    case 'seuil_max':
      return <AlertTriangle className="h-4 w-4" />
    case 'erreur':
      return <XCircle className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

const getAlertColor = (type: string, statut: string) => {
  if (statut === 'resolue') return 'text-green-600'
  if (statut === 'ignoree') return 'text-gray-500'
  
  switch (type) {
    case 'deconnexion':
    case 'erreur':
      return 'text-red-600'
    case 'seuil_min':
    case 'seuil_max':
      return 'text-orange-600'
    default:
      return 'text-red-600'
  }
}

const getAlertMessage = (alerte: Alerte) => {
  switch (alerte.type) {
    case 'deconnexion':
      return 'Capteur déconnecté'
    case 'seuil_min':
      return `Valeur sous le seuil minimum (${alerte.valeur} < seuil)`
    case 'seuil_max':
      return `Valeur au-dessus du seuil maximum (${alerte.valeur} > seuil)`
    case 'erreur':
      return 'Erreur capteur'
    default:
      return 'Alerte capteur'
  }
}

export function AlertsPanel({ alertes, onResolveAlert, onIgnoreAlert }: AlertsPanelProps) {
  const alertesActives = alertes.filter(a => a.statut === 'active')
  const alertesResolues = alertes.filter(a => a.statut === 'resolue')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertesActives.length}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolues Aujourd'hui</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alertesResolues.length}</div>
            <p className="text-xs text-muted-foreground">
              Problèmes résolus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15min</div>
            <p className="text-xs text-muted-foreground">
              Résolution d'alerte
            </p>
          </CardContent>
        </Card>
      </div>

      {alertesActives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertes Actives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertesActives.map((alerte) => (
              <div key={alerte.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={getAlertColor(alerte.type, alerte.statut)}>
                    {getAlertIcon(alerte.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {alerte.capteur?.name || 'Capteur inconnu'}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {alerte.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getAlertMessage(alerte)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alerte.capteur?.service.floor.clinique.nom} - {alerte.capteur?.service.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alerte.date.toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {onResolveAlert && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResolveAlert(alerte.id)}
                    >
                      Résoudre
                    </Button>
                  )}
                  {onIgnoreAlert && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onIgnoreAlert(alerte.id)}
                    >
                      Ignorer
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {alertesResolues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertes Récemment Résolues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertesResolues.slice(0, 5).map((alerte) => (
              <div key={alerte.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <span className="text-sm font-medium">
                      {alerte.capteur?.name || 'Capteur inconnu'}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {getAlertMessage(alerte)} - Résolu
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Résolu
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
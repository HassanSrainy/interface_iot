import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Building, Users, AlertTriangle, Activity } from "lucide-react"
import { CapteurWithRelations, Alerte } from "../../types/domain"

interface ClinicOverviewProps {
  capteurs: CapteurWithRelations[]
  alertes: Alerte[]
}

export function ClinicOverview({ capteurs, alertes }: ClinicOverviewProps) {
  // Regrouper les capteurs par clinique
  const capteursByClinic = capteurs.reduce((acc, capteur) => {
    const clinicId = capteur.service.floor.clinique.id
    const clinicName = capteur.service.floor.clinique.nom
    
    if (!acc[clinicId]) {
      acc[clinicId] = {
        nom: clinicName,
        adresse: capteur.service.floor.clinique.adresse,
        capteurs: [],
        capteursEnLigne: 0,
        alertesActives: 0
      }
    }
    
    acc[clinicId].capteurs.push(capteur)
    if (capteur.status === 'online') {
      acc[clinicId].capteursEnLigne++
    }
    
    return acc
  }, {} as Record<string, {
    nom: string
    adresse: string
    capteurs: CapteurWithRelations[]
    capteursEnLigne: number
    alertesActives: number
  }>)

  // Compter les alertes par clinique
  alertes.forEach(alerte => {
    if (alerte.statut === 'active' && alerte.capteur) {
      const clinicId = alerte.capteur.service.floor.clinique.id
      if (capteursByClinic[clinicId]) {
        capteursByClinic[clinicId].alertesActives++
      }
    }
  })

  const cliniques = Object.values(capteursByClinic)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cliniques</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cliniques.length}</div>
            <p className="text-xs text-muted-foreground">
              Cliniques actives dans le réseau
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capteurs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capteurs.length}</div>
            <p className="text-xs text-muted-foreground">
              {capteurs.filter(c => c.status === 'online').length} en ligne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alertes.filter(a => a.statut === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3>Vue par Clinique</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {cliniques.map((clinique, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{clinique.nom}</CardTitle>
                  {clinique.alertesActives > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {clinique.alertesActives} alerte{clinique.alertesActives > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{clinique.adresse}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{clinique.capteurs.length}</div>
                    <p className="text-xs text-muted-foreground">Capteurs</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{clinique.capteursEnLigne}</div>
                    <p className="text-xs text-muted-foreground">En ligne</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{clinique.alertesActives}</div>
                    <p className="text-xs text-muted-foreground">Alertes</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Services équipés:</h4>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(clinique.capteurs.map(c => c.service.nom))].map((service, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
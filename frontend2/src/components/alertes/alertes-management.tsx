import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { CalendarIcon, Filter, AlertTriangle, CheckCircle, XCircle, Clock, Building, MapPin } from 'lucide-react'
import { Alerte, CapteurWithRelations } from '../../types/domain'

interface AlertesManagementProps {
  alertes: Alerte[]
  capteurs: CapteurWithRelations[]
  onResolveAlert: (alerteId: string) => void
  onIgnoreAlert: (alerteId: string) => void
}

export function AlertesManagement({ 
  alertes, 
  capteurs,
  onResolveAlert, 
  onIgnoreAlert
}: AlertesManagementProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [capteurFilter, setCapteurFilter] = useState<string>('all')
  
  // Format date function locale
  const formatDate = (date: Date, formatStr: string) => {
    if (formatStr === 'dd/MM/yyyy') {
      return date.toLocaleDateString('fr-FR')
    }
    if (formatStr === 'HH:mm') {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    if (formatStr === 'LLL dd, y') {
      return date.toLocaleDateString('fr-FR', { month: 'short', day: '2-digit', year: 'numeric' })
    }
    return date.toLocaleDateString('fr-FR')
  }

  // Filtrage des alertes
  const filteredAlertes = alertes.filter(alerte => {
    const matchesStatus = statusFilter === 'all' || alerte.statut === statusFilter
    const matchesType = typeFilter === 'all' || alerte.type === typeFilter
    const matchesCapteur = capteurFilter === 'all' || alerte.capteur_id === capteurFilter
    
    const alerteDate = new Date(alerte.date_creation)
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
      (alerteDate >= dateRange.from && alerteDate <= dateRange.to)
    
    return matchesStatus && matchesType && matchesCapteur && matchesDateRange
  })

  const getAlertTypeName = (type: string) => {
    switch (type) {
      case 'seuil_min': return 'Seuil minimum'
      case 'seuil_max': return 'Seuil maximum'
      case 'deconnexion': return 'Déconnexion'
      case 'erreur': return 'Erreur'
      default: return type
    }
  }

  const getAlertTypeBadge = (type: string) => {
    switch (type) {
      case 'seuil_min': return 'destructive'
      case 'seuil_max': return 'destructive'
      case 'deconnexion': return 'secondary'
      case 'erreur': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'active': return 'destructive'
      case 'resolue': return 'default'
      case 'ignoree': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'active': return <AlertTriangle className="h-4 w-4" />
      case 'resolue': return <CheckCircle className="h-4 w-4" />
      case 'ignoree': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const alertesActives = alertes.filter(a => a.statut === 'active').length
  const alertesResolues = alertes.filter(a => a.statut === 'resolue').length
  const alertesIgnorees = alertes.filter(a => a.statut === 'ignoree').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Gestion des Alertes</h2>
          <p className="text-muted-foreground">
            Historique et gestion de toutes les alertes du système
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alertes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{alertesActives}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes Résolues</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{alertesResolues}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes Ignorées</CardTitle>
              <XCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{alertesIgnorees}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolue">Résolue</SelectItem>
                    <SelectItem value="ignoree">Ignorée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="seuil_min">Seuil minimum</SelectItem>
                    <SelectItem value="seuil_max">Seuil maximum</SelectItem>
                    <SelectItem value="deconnexion">Déconnexion</SelectItem>
                    <SelectItem value="erreur">Erreur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Capteur</label>
                <Select value={capteurFilter} onValueChange={setCapteurFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les capteurs</SelectItem>
                    {capteurs.map(capteur => (
                      <SelectItem key={capteur.id} value={capteur.id}>
                        {capteur.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Période</label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setDateRange({})}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from && dateRange?.to 
                    ? `${formatDate(dateRange.from, "dd/MM/yyyy")} - ${formatDate(dateRange.to, "dd/MM/yyyy")}`
                    : "Toutes les dates"
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des alertes */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des alertes</CardTitle>
            <CardDescription>
              {filteredAlertes.length} alerte(s) trouvée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Capteur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlertes
                  .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime())
                  .map((alerte) => {
                    const capteur = capteurs.find(c => c.id === alerte.capteur_id)
                    return (
                      <TableRow key={alerte.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatDate(new Date(alerte.date_creation), "dd/MM/yyyy")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(new Date(alerte.date_creation), "HH:mm")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{capteur?.name || 'Capteur inconnu'}</div>
                            <div className="text-sm text-muted-foreground">
                              {capteur?.matricule}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getAlertTypeBadge(alerte.type) as any}>
                            {getAlertTypeName(alerte.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm">{alerte.message}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {alerte.valeur} {capteur?.unit || ''}
                          </div>
                          {alerte.type.includes('seuil') && capteur && (
                            <div className="text-sm text-muted-foreground">
                              Seuils: {capteur.seuil_min} - {capteur.seuil_max}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(alerte.statut)}
                            <Badge variant={getStatusBadge(alerte.statut) as any}>
                              {alerte.statut === 'active' ? 'Active' :
                               alerte.statut === 'resolue' ? 'Résolue' : 'Ignorée'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{capteur?.location}</div>
                            {capteur?.service && (
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Building className="h-3 w-3 mr-1" />
                                {capteur.service.floor.clinique.nom}
                              </div>
                            )}
                            {capteur?.service && (
                              <div className="text-sm text-muted-foreground flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {capteur.service.floor.nom} - {capteur.service.nom}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {alerte.statut === 'active' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => onResolveAlert(alerte.id)}
                                  title="Résoudre l'alerte"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => onIgnoreAlert(alerte.id)}
                                  title="Ignorer l'alerte"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
            
            {filteredAlertes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune alerte trouvée avec les filtres sélectionnés</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
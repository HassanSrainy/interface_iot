import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { AlertTriangle, CheckCircle, XCircle, Search, Filter } from 'lucide-react'

interface Sensor {
  id: string
  matricule?: string
  famille_id?: number
  service_id?: number
  date_installation?: string
  date_derniere_connexion?: string
  date_derniere_deconnexion?: string
  seuil_min?: number
  seuil_max?: number
  adresse_ip?: string
  created_at?: string
  updated_at?: string
}

interface Alerte {
  id: number
  capteur_id?: number
  mesure_id?: number | null
  type: string
  valeur?: number
  date: string
  statut: 'non_lue' | 'active' | 'resolue' | 'ignoree'
  created_at?: string
  updated_at?: string
  capteur?: Sensor
  mesure?: {
    id: number
    capteur_id: number
    valeur: number
    date_mesure: string
    created_at: string
    updated_at: string
  } | null
}

export function AlertesManagement() {
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Récupération des alertes depuis l'API
  useEffect(() => {
    const fetchAlertes = async () => {
      try {
        setLoading(true)
        const res = await fetch('http://127.0.0.1:8000/api/alertes')
        if (!res.ok) throw new Error('Erreur lors du chargement des alertes')
        const data = await res.json()
        setAlertes(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAlertes()
  }, [])

  // Actions pour résoudre ou ignorer une alerte
  const handleResolveAlert = async (alerteId: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/alertes/${alerteId}/resolve`, {
        method: 'PATCH'
      })
      setAlertes(prev =>
        prev.map(a => (a.id === alerteId ? { ...a, statut: 'resolue' } : a))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleIgnoreAlert = async (alerteId: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/alertes/${alerteId}/ignore`, {
        method: 'PATCH'
      })
      setAlertes(prev =>
        prev.map(a => (a.id === alerteId ? { ...a, statut: 'ignoree' } : a))
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Filtres
  const filteredAlertes = alertes.filter(a => {
    const matchesSearch =
      a.capteur?.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.valeur?.toString().includes(searchTerm) ||
      a.id.toString().includes(searchTerm)

    const matchesStatus = filterStatus === 'all' || a.statut === filterStatus
    const matchesPriority = filterPriority === 'all' || a.type === filterPriority

    return matchesSearch && matchesStatus && matchesPriority
  })

  const activeAlertes = alertes.filter(a => a.statut === 'active')
  const resolvedAlertes = alertes.filter(a => a.statut === 'resolue')
  const ignoredAlertes = alertes.filter(a => a.statut === 'ignoree')

  if (loading) return <p>Chargement des alertes...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Gestion des Alertes</h1>

      {/* Filtres */}
      <Card>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par matricule, type ou valeur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolue">Résolue</SelectItem>
                <SelectItem value="ignoree">Ignorée</SelectItem>
                <SelectItem value="non_lue">Non lue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes ({alertes.length})</TabsTrigger>
          <TabsTrigger value="active">Actives ({activeAlertes.length})</TabsTrigger>
          <TabsTrigger value="resolved">Résolues ({resolvedAlertes.length})</TabsTrigger>
          <TabsTrigger value="ignored">Ignorées ({ignoredAlertes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AlertesTable
            alertes={filteredAlertes}
            onResolveAlert={handleResolveAlert}
            onIgnoreAlert={handleIgnoreAlert}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="active">
          <AlertesTable
            alertes={filteredAlertes.filter(a => a.statut === 'active')}
            onResolveAlert={handleResolveAlert}
            onIgnoreAlert={handleIgnoreAlert}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="resolved">
          <AlertesTable
            alertes={filteredAlertes.filter(a => a.statut === 'resolue')}
            onResolveAlert={handleResolveAlert}
            onIgnoreAlert={handleIgnoreAlert}
            showActions={false}
          />
        </TabsContent>

        <TabsContent value="ignored">
          <AlertesTable
            alertes={filteredAlertes.filter(a => a.statut === 'ignoree')}
            onResolveAlert={handleResolveAlert}
            onIgnoreAlert={handleIgnoreAlert}
            showActions={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface AlertesTableProps {
  alertes: Alerte[]
  onResolveAlert: (alerteId: number) => void
  onIgnoreAlert: (alerteId: number) => void
  showActions: boolean
}

function AlertesTable({ alertes, onResolveAlert, onIgnoreAlert, showActions }: AlertesTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capteur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              {showActions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertes.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.capteur?.matricule ?? 'N/A'}</TableCell>
                <TableCell>
                  <Badge>{a.type}</Badge>
                </TableCell>
                <TableCell>{a.valeur ?? 'N/A'}</TableCell>
                <TableCell>
                  <Badge>{a.statut}</Badge>
                </TableCell>
                <TableCell>{formatDate(a.date)}</TableCell>
                {showActions && (
                  <TableCell>
                    {a.statut === 'active' && (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => onResolveAlert(a.id)}>
                          Résoudre
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onIgnoreAlert(a.id)}>
                          Ignorer
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// frontend3/src/components/alertes/AlertesManagement.tsx
import { useState, useEffect, useMemo } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Search, Filter } from 'lucide-react'

/* ---------- Types ---------- */
interface Sensor {
  id: string
  matricule?: string
  // autres champs optionnels...
}

type RawStatut = 'non_lue' | 'active' | 'resolue' | 'ignoree' | 'actif' | 'inactif' | string

interface Alerte {
  id: number
  capteur_id?: number
  mesure_id?: number | null
  type: string
  valeur?: number
  date: string
  statut: RawStatut
  capteur?: Sensor
}

/* ---------- Helpers ---------- */
const isActiveStatus = (s: RawStatut) => {
  return s === 'active' || s === 'non_lue' || s === 'actif'
}
const isInactiveStatus = (s: RawStatut) => {
  return s === 'resolue' || s === 'ignoree' || s === 'inactif'
}

/* ---------- Component ---------- */
export function AlertesManagement() {
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'actif' | 'inactif'>('all')
  const [filterType, setFilterType] = useState<'all' | string>('all')

  // Fetch alerts (read-only)
  useEffect(() => {
    let mounted = true
    const fetchAlertes = async () => {
      try {
        setLoading(true)
        const res = await fetch('http://127.0.0.1:8000/api/alertes')
        if (!res.ok) throw new Error('Erreur lors du chargement des alertes')
        const data = await res.json()
        if (!mounted) return
        // Supporte plusieurs formes de payload (array ou { data: [...] })
        setAlertes(Array.isArray(data) ? data : data.data ?? [])
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? 'Erreur réseau')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchAlertes()
    return () => { mounted = false }
  }, [])

  // Refresh helper
  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/alertes')
      if (!res.ok) throw new Error('Erreur lors du rafraîchissement')
      const data = await res.json()
      setAlertes(Array.isArray(data) ? data : data.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  // available types for filter
  const types = useMemo(() => {
    const s = new Set<string>()
    alertes.forEach(a => { if (a.type) s.add(a.type) })
    return ['all', ...Array.from(s)]
  }, [alertes])

  // filtered alertes (search + status + type)
  const filteredAlertes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return alertes.filter(a => {
      const matchesSearch =
        q === '' ||
        (a.capteur?.matricule ?? '').toString().toLowerCase().includes(q) ||
        (a.type ?? '').toLowerCase().includes(q) ||
        (a.valeur ?? '').toString().includes(q) ||
        a.id.toString().includes(q)

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'actif' && isActiveStatus(a.statut)) ||
        (filterStatus === 'inactif' && isInactiveStatus(a.statut))

      const matchesType = filterType === 'all' || a.type === filterType

      return matchesSearch && matchesStatus && matchesType
    })
  }, [alertes, searchTerm, filterStatus, filterType])

  const counts = useMemo(() => ({
    total: alertes.length,
    actif: alertes.filter(a => isActiveStatus(a.statut)).length,
    inactif: alertes.filter(a => isInactiveStatus(a.statut)).length
  }), [alertes])

  if (loading) return <p>Chargement des alertes...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestion des Alertes</h1>
          <p className="text-sm text-muted-foreground">Affichage des alertes (lecture seule)</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-sm">
            <div>Total: <span className="font-medium">{counts.total}</span></div>
            <div>Actives: <span className="font-medium">{counts.actif}</span></div>
            <div>Inactives: <span className="font-medium">{counts.inactif}</span></div>
          </div>
          <Button onClick={refresh} variant="ghost" size="sm">Rafraîchir</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Rechercher par matricule, type, valeur, id..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-center">
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type d'alerte" />
              </SelectTrigger>
              <SelectContent>
                {types.map(t => <SelectItem key={t} value={t}>{t === 'all' ? 'Toutes les types' : t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs + table */}
      <Tabs defaultValue="all" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <TabsList>
              <TabsTrigger value="all">Toutes ({counts.total})</TabsTrigger>
              <TabsTrigger value="actif">Actives ({counts.actif})</TabsTrigger>
              <TabsTrigger value="inactif">Inactives ({counts.inactif})</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="all">
                <AlertesTable alertes={filteredAlertes} />
              </TabsContent>

              <TabsContent value="actif">
                <AlertesTable alertes={filteredAlertes.filter(a => isActiveStatus(a.statut))} />
              </TabsContent>

              <TabsContent value="inactif">
                <AlertesTable alertes={filteredAlertes.filter(a => isInactiveStatus(a.statut))} />
              </TabsContent>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}

/* ---------- Table component (lecture seule) ---------- */

function AlertesTable({ alertes }: { alertes: Alerte[] }) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const statutBadge = (s: RawStatut) => {
    if (isActiveStatus(s)) return <Badge className="bg-yellow-100 text-yellow-800">Actif</Badge>
    if (isInactiveStatus(s)) return <Badge className="bg-green-100 text-green-800">Inactif</Badge>
    return <Badge>{s}</Badge>
  }

  const typeBadge = (t: string) => {
    const tl = t.toLowerCase()
    if (tl.includes('deconn') || tl.includes('panne')) return <Badge className="bg-red-100 text-red-700">{t}</Badge>
    if (tl.includes('high') || tl.includes('haut')) return <Badge className="bg-orange-100 text-orange-700">{t}</Badge>
    if (tl.includes('low') || tl.includes('bas') || tl.includes('lower')) return <Badge className="bg-blue-100 text-blue-700">{t}</Badge>
    return <Badge>{t}</Badge>
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
            </TableRow>
          </TableHeader>

          <TableBody>
            {alertes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Aucune alerte trouvée.
                </TableCell>
              </TableRow>
            )}

            {alertes.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.capteur?.matricule ?? ('#' + (a.capteur_id ?? 'N/A'))}</TableCell>
                <TableCell>{typeBadge(a.type)}</TableCell>
                <TableCell>{a.valeur ?? '—'}</TableCell>
                <TableCell>{statutBadge(a.statut)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(a.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

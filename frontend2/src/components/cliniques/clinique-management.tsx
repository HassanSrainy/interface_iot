import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Plus, Edit, Trash2, MapPin, Building } from 'lucide-react'
import { Clinique } from '../../types/domain'

interface CliniqueManagementProps {
  cliniques: Clinique[]
  onAddClinique: (clinique: Omit<Clinique, 'id' | 'created_at' | 'updated_at'>) => void
  onUpdateClinique: (id: string, clinique: Partial<Clinique>) => void
  onDeleteClinique: (id: string) => void
}

export function CliniqueManagement({ 
  cliniques, 
  onAddClinique, 
  onUpdateClinique, 
  onDeleteClinique 
}: CliniqueManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingClinique, setEditingClinique] = useState<Clinique | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    adresse: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClinique) {
      onUpdateClinique(editingClinique.id, formData)
      setEditingClinique(null)
    } else {
      onAddClinique(formData)
      setIsAddDialogOpen(false)
    }
    setFormData({ nom: '', adresse: '' })
  }

  const handleEdit = (clinique: Clinique) => {
    setEditingClinique(clinique)
    setFormData({
      nom: clinique.nom,
      adresse: clinique.adresse
    })
  }

  const handleCancelEdit = () => {
    setEditingClinique(null)
    setFormData({ nom: '', adresse: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Gestion des Cliniques</h2>
          <p className="text-muted-foreground">
            Gérez les cliniques et leurs informations
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une clinique
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Nouvelle Clinique</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle clinique au système
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de la clinique</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Clinique Saint-Antoine"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse complète</Label>
                  <Textarea
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="123 Rue de la Santé, Paris 75012"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Ajouter</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cliniques</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cliniques.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cliniques Actives</CardTitle>
              <Badge variant="default" className="h-4 w-4">✓</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cliniques.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Villes Couvertes</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(cliniques.map(c => c.adresse.split(',').pop()?.trim())).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des cliniques */}
        <Card>
          <CardHeader>
            <CardTitle>Cliniques enregistrées</CardTitle>
            <CardDescription>
              Liste de toutes les cliniques dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cliniques.map((clinique) => (
                  <TableRow key={clinique.id}>
                    <TableCell>
                      {editingClinique?.id === clinique.id ? (
                        <Input
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        <div>
                          <div className="font-medium">{clinique.nom}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingClinique?.id === clinique.id ? (
                        <Textarea
                          value={formData.adresse}
                          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                          className="w-full min-h-[60px]"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground max-w-xs">
                          {clinique.adresse}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(clinique.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {editingClinique?.id === clinique.id ? (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleSubmit(new Event('submit') as any)}
                            >
                              Sauvegarder
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleCancelEdit}
                            >
                              Annuler
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEdit(clinique)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => onDeleteClinique(clinique.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
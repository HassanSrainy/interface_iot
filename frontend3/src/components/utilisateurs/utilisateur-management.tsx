import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Plus, Edit, Trash2, Users, UserCheck, UserX, Shield } from 'lucide-react'
import { Utilisateur, Clinique } from '../../types/domain'

interface UtilisateurManagementProps {
  utilisateurs: Utilisateur[]
  cliniques: Clinique[]
  onAddUtilisateur: (utilisateur: Omit<Utilisateur, 'id' | 'created_at' | 'updated_at' | 'date_creation'>) => void
  onUpdateUtilisateur: (id: string, utilisateur: Partial<Utilisateur>) => void
  onDeleteUtilisateur: (id: string) => void
}

const ROLES = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'gestionnaire', label: 'Gestionnaire' },
  { value: 'technicien', label: 'Technicien' },
  { value: 'operateur', label: 'Opérateur' }
]

const STATUTS = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'suspendu', label: 'Suspendu' }
]

const PERMISSIONS = [
  'gestion_capteurs',
  'gestion_alertes', 
  'gestion_utilisateurs',
  'gestion_cliniques',
  'maintenance_capteurs',
  'resolution_alertes',
  'lecture_capteurs',
  'lecture_alertes'
]

export function UtilisateurManagement({ 
  utilisateurs, 
  cliniques,
  onAddUtilisateur, 
  onUpdateUtilisateur, 
  onDeleteUtilisateur 
}: UtilisateurManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUtilisateur, setEditingUtilisateur] = useState<Utilisateur | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'operateur' as Utilisateur['role'],
    clinique_id: '',
    statut: 'actif' as Utilisateur['statut'],
    permissions: [] as string[],
    adresse: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUtilisateur) {
      onUpdateUtilisateur(editingUtilisateur.id, formData)
      setEditingUtilisateur(null)
    } else {
      onAddUtilisateur({
        ...formData,
        derniere_connexion: undefined
      })
      setIsAddDialogOpen(false)
    }
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      role: 'operateur',
      clinique_id: '',
      statut: 'actif',
      permissions: [],
      adresse: ''
    })
  }

  const handleEdit = (utilisateur: Utilisateur) => {
    setEditingUtilisateur(utilisateur)
    setFormData({
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      telephone: utilisateur.telephone || '',
      role: utilisateur.role,
      clinique_id: utilisateur.clinique_id || '',
      statut: utilisateur.statut,
      permissions: [...utilisateur.permissions],
      adresse: utilisateur.adresse || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingUtilisateur(null)
    resetForm()
  }

  const togglePermission = (permission: string) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission]
    setFormData({ ...formData, permissions: newPermissions })
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'gestionnaire': return 'default'
      case 'technicien': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'actif': return 'default'
      case 'inactif': return 'secondary'
      case 'suspendu': return 'destructive'
      default: return 'outline'
    }
  }

  const utilisateursActifs = utilisateurs.filter(u => u.statut === 'actif').length
  const utilisateursInactifs = utilisateurs.filter(u => u.statut !== 'actif').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Gestion des Utilisateurs</h2>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et leurs permissions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Nouvel Utilisateur</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouvel utilisateur au système
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      placeholder="Jean"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder="Martin"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean.martin@clinique.fr"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="+33 1 42 34 56 78"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: Utilisateur['role']) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statut">Statut</Label>
                    <Select 
                      value={formData.statut} 
                      onValueChange={(value: Utilisateur['statut']) => setFormData({ ...formData, statut: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUTS.map(statut => (
                          <SelectItem key={statut.value} value={statut.value}>
                            {statut.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinique">Clinique</Label>
                  <Select 
                    value={formData.clinique_id} 
                    onValueChange={(value) => setFormData({ ...formData, clinique_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une clinique" />
                    </SelectTrigger>
                    <SelectContent>
                      {cliniques.map(clinique => (
                        <SelectItem key={clinique.id} value={clinique.id}>
                          {clinique.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Textarea
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="123 Rue de l'utilisateur, Ville 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERMISSIONS.map(permission => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={formData.permissions.includes(permission)}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{utilisateurs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{utilisateursActifs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Inactifs</CardTitle>
              <UserX className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{utilisateursInactifs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {utilisateurs.filter(u => u.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs enregistrés</CardTitle>
            <CardDescription>
              Liste de tous les utilisateurs dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Clinique</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilisateurs.map((utilisateur) => (
                  <TableRow key={utilisateur.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {utilisateur.prenom} {utilisateur.nom}
                        </div>
                        {utilisateur.telephone && (
                          <div className="text-sm text-muted-foreground">
                            {utilisateur.telephone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{utilisateur.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(utilisateur.role)}>
                        {ROLES.find(r => r.value === utilisateur.role)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {utilisateur.clinique?.nom || 'Non assigné'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatutBadgeVariant(utilisateur.statut)}>
                        {STATUTS.find(s => s.value === utilisateur.statut)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {utilisateur.derniere_connexion 
                        ? new Date(utilisateur.derniere_connexion).toLocaleDateString('fr-FR')
                        : 'Jamais'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(utilisateur)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => onDeleteUtilisateur(utilisateur.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour l'édition */}
      {editingUtilisateur && (
        <Dialog open={true} onOpenChange={handleCancelEdit}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Modifier l'utilisateur</DialogTitle>
                <DialogDescription>
                  Modifiez les informations de {editingUtilisateur.prenom} {editingUtilisateur.nom}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-prenom">Prénom</Label>
                    <Input
                      id="edit-prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nom">Nom</Label>
                    <Input
                      id="edit-nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-telephone">Téléphone</Label>
                  <Input
                    id="edit-telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Rôle</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: Utilisateur['role']) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-statut">Statut</Label>
                    <Select 
                      value={formData.statut} 
                      onValueChange={(value: Utilisateur['statut']) => setFormData({ ...formData, statut: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUTS.map(statut => (
                          <SelectItem key={statut.value} value={statut.value}>
                            {statut.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-clinique">Clinique</Label>
                  <Select 
                    value={formData.clinique_id} 
                    onValueChange={(value) => setFormData({ ...formData, clinique_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une clinique" />
                    </SelectTrigger>
                    <SelectContent>
                      {cliniques.map(clinique => (
                        <SelectItem key={clinique.id} value={clinique.id}>
                          {clinique.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-adresse">Adresse</Label>
                  <Textarea
                    id="edit-adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERMISSIONS.map(permission => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${permission}`}
                          checked={formData.permissions.includes(permission)}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <Label htmlFor={`edit-${permission}`} className="text-sm">
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Annuler
                </Button>
                <Button type="submit">Sauvegarder</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
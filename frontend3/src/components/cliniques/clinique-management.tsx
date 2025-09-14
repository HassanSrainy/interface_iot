import { useEffect, useState } from 'react';
import api from '../../api/axios'; // adapte le chemin si nécessaire

// Imports UI individuels
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

interface Clinique {
  id: number;
  nom: string;
  adresse: string;
}

export function CliniqueManagement() {
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClinique, setEditingClinique] = useState<Clinique | null>(null);
  const [formData, setFormData] = useState({ nom: '', adresse: '' });

  // Charger les cliniques depuis l'API
  useEffect(() => {
    fetchCliniques();
  }, []);

  const fetchCliniques = async () => {
    try {
      const res = await api.get('/cliniques');
      setCliniques(res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des cliniques', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingClinique) {
        await api.put(`/cliniques/${editingClinique.id}`, formData);
      } else {
        await api.post('/cliniques', formData);
      }
      fetchCliniques();
      resetForm();
      setIsAddOpen(false);
      setEditingClinique(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/cliniques/${id}`);
      setCliniques(cliniques.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression', error);
    }
  };

  const handleEdit = (clinique: Clinique) => {
    setFormData({ nom: clinique.nom, adresse: clinique.adresse });
    setEditingClinique(clinique);
    setIsAddOpen(true);
  };

  const resetForm = () => setFormData({ nom: '', adresse: '' });
  const isFormValid = formData.nom.trim() !== '' && formData.adresse.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Gestion des Cliniques</h1>
          <p className="text-muted-foreground">Gérez les cliniques et leurs informations</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Clinique
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClinique ? 'Modifier la clinique' : 'Ajouter une nouvelle clinique'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom de la clinique</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Clinique Saint-Antoine"
                />
              </div>
              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Ex: 123 Rue de la Santé, Paris 75012"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditingClinique(null); }}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={!isFormValid}>{editingClinique ? 'Modifier' : 'Ajouter'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center space-x-2">
            <Building2 className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Cliniques</p>
              <p className="text-2xl font-semibold">{cliniques.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des cliniques */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des cliniques</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cliniques.map((clinique) => (
                <TableRow key={clinique.id}>
                  <TableCell>{clinique.nom}</TableCell>
                  <TableCell>{clinique.adresse}</TableCell>
                  <TableCell>{clinique.adresse.split(',').pop()?.trim()}</TableCell>
                  <TableCell className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(clinique)}><Edit className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm"><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer la clinique</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer "{clinique.nom}" ? Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(clinique.id)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {cliniques.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune clinique enregistrée</p>
              <p className="text-sm">Commencez par ajouter votre première clinique</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

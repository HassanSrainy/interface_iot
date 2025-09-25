// frontend3/src/components/cliniques/CliniqueManagement.tsx
import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog';

interface Clinique {
  id: number;
  nom: string;
  adresse: string;
  ville: string;
}

export function CliniqueManagement() {
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClinique, setEditingClinique] = useState<Clinique | null>(null);
  const [formData, setFormData] = useState({ nom: '', adresse: '', ville: '' });

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
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/cliniques/${id}`);
      setCliniques((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression', error);
    }
  };

  const openModalForEdit = (clinique: Clinique) => {
    setEditingClinique(clinique);
    setFormData({ nom: clinique.nom, adresse: clinique.adresse, ville: clinique.ville });
    setIsModalOpen(true);
  };

  const openModalForAdd = () => {
    setEditingClinique(null);
    setFormData({ nom: '', adresse: '', ville: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClinique(null);
  };

  const isFormValid = useMemo(
    () => formData.nom.trim() && formData.adresse.trim() && formData.ville.trim(),
    [formData]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Gestion des Cliniques</h1>
          <p className="text-muted-foreground">Gérez les cliniques et leurs informations</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openModalForAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Clinique
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClinique ? 'Modifier la clinique' : 'Ajouter une nouvelle clinique'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <FormField label="Nom de la clinique" value={formData.nom} onChange={(v) => setFormData({ ...formData, nom: v })} />
              <FormField label="Adresse" value={formData.adresse} onChange={(v) => setFormData({ ...formData, adresse: v })} />
              <FormField label="Ville" value={formData.ville} onChange={(v) => setFormData({ ...formData, ville: v })} />
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={closeModal}>Annuler</Button>
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

      {/* Tableau */}
      <CliniqueTable cliniques={cliniques} onEdit={openModalForEdit} onDelete={handleDelete} />
    </div>
  );
}

/* ---------- Composants enfants ---------- */
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}
const FormField = ({ label, value, onChange }: FormFieldProps) => (
  <div>
    <Label>{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

interface CliniqueTableProps {
  cliniques: Clinique[];
  onEdit: (c: Clinique) => void;
  onDelete: (id: number) => void;
}

const CliniqueTable = ({ cliniques, onEdit, onDelete }: CliniqueTableProps) => (
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
          {cliniques.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune clinique enregistrée</p>
                <p className="text-sm">Commencez par ajouter votre première clinique</p>
              </TableCell>
            </TableRow>
          ) : (
            cliniques.map((clinique) => (
              <TableRow key={clinique.id}>
                <TableCell>{clinique.nom}</TableCell>
                <TableCell>{clinique.adresse}</TableCell>
                <TableCell>{clinique.ville}</TableCell>
                <TableCell className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(clinique)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                        <AlertDialogAction onClick={() => onDelete(clinique.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

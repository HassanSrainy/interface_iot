// src/components/familles/FamillesManagementDialog.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '../ui/alert-dialog';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { getFamilies, createFamily, updateFamily, deleteFamily } from '../familles/familles-api';
import { getTypes } from '../types/types-api';
import type { AxiosError } from 'axios';

type ValidationErrors = Record<string, string[]>;

interface FamillesManagementDialogProps {
  onSaved?: () => void;
}

const normalizeAxiosData = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  const keys = ['items', 'results', 'rows', 'familles'];
  for (const k of keys) if (Array.isArray(data[k])) return data[k];
  const vals = Object.values(data).filter(v => Array.isArray(v));
  if (vals.length > 0) return vals[0];
  return [];
};

export default function FamillesManagementDialog({ onSaved }: FamillesManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [families, setFamilies] = useState<any[]>([]);
  const [types, setTypes] = useState<{ id: number; type?: string; nom?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // création rapide
  const [newName, setNewName] = useState('');
  const [newTypeId, setNewTypeId] = useState<number | ''>('');

  // édition
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTypeId, setEditTypeId] = useState<number | ''>('');

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErrors({});
    setFormError(null);
    try {
      const [fResp, tResp] = await Promise.all([getFamilies(), getTypes()]);
      setFamilies(normalizeAxiosData(fResp));
      setTypes(normalizeAxiosData(tResp));
    } catch (err) {
      console.error('Familles load failed', err);
      setFamilies([]);
      setTypes([]);
      setFormError('Erreur lors du chargement des familles / types.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAdd = async () => {
    setErrors({});
    setFormError(null);
    if (!newName.trim()) {
      setErrors({ famille: ['Le nom de la famille est requis.'] });
      return;
    }
    if (newTypeId === '') {
      setErrors(prev => ({ ...prev, type_id: ['Le type associé est requis.'] }));
      return;
    }

    setIsSaving(true);
    try {
      await createFamily({ famille: newName, type_id: Number(newTypeId) } as any);
      setNewName('');
      setNewTypeId('');
      await load();
      onSaved?.();
    } catch (err) {
      console.error('createFamily failed', err);
      const axiosErr = err as AxiosError<any>;
      const resp = axiosErr.response;
      if (resp && resp.status === 422) {
        const validationErrors: ValidationErrors =
          resp.data?.errors ?? (typeof resp.data === 'object' ? resp.data : {});
        setErrors(validationErrors);
        if (resp.data?.message) setFormError(String(resp.data.message));
      } else {
        setFormError('Erreur lors de la création de la famille.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (f: any) => {
    setEditingId(f.id);
    setEditName(f.famille ?? '');
    setEditTypeId(f.type?.id ?? '');
    setErrors({});
    setFormError(null);
  };

  const handleSaveEdit = async (id: number) => {
    setErrors({});
    setFormError(null);
    if (!editName.trim()) {
      setErrors({ famille: ['Le nom de la famille est requis.'] });
      return;
    }
    if (editTypeId === '') {
      setErrors(prev => ({ ...prev, type_id: ['Le type associé est requis.'] }));
      return;
    }

    setIsSaving(true);
    try {
      await updateFamily(id, { famille: editName, type_id: Number(editTypeId) } as any);
      setEditingId(null);
      setEditName('');
      setEditTypeId('');
      await load();
      onSaved?.();
    } catch (err) {
      console.error('updateFamily failed', err);
      const axiosErr = err as AxiosError<any>;
      const resp = axiosErr.response;
      if (resp && resp.status === 422) {
        const validationErrors: ValidationErrors =
          resp.data?.errors ?? (typeof resp.data === 'object' ? resp.data : {});
        setErrors(validationErrors);
        if (resp.data?.message) setFormError(String(resp.data.message));
      } else {
        setFormError('Erreur lors de la mise à jour de la famille.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setErrors({});
    setFormError(null);
    setIsSaving(true);
    try {
      await deleteFamily(id);
      await load();
      onSaved?.();
    } catch (err) {
      console.error('deleteFamily failed', err);
      setFormError('Erreur lors de la suppression de la famille.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Gérer Familles
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des Familles</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Crée, édite ou supprime des familles. Chaque famille est liée à un type.
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-3">
          <CardHeader>
            <CardTitle>Nouvelle Famille</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Nom de la famille</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  aria-invalid={!!errors.famille}
                  aria-describedby={errors.famille ? 'famille-add-error' : undefined}
                />
                {errors.famille && <p id="famille-add-error" className="text-xs text-red-600 mt-1">{errors.famille[0]}</p>}
              </div>

              <div>
                <Label>Type associé</Label>
                <select
                  className="input w-full"
                  value={newTypeId}
                  onChange={e => setNewTypeId(e.target.value === '' ? '' : Number(e.target.value))}
                  aria-invalid={!!errors.type_id}
                  aria-describedby={errors.type_id ? 'type-add-error' : undefined}
                >
                  <option value="">-- Choisir un type --</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.type ?? t.nom}</option>)}
                </select>
                {errors.type_id && <p id="type-add-error" className="text-xs text-red-600 mt-1">{errors.type_id[0]}</p>}
              </div>

              <div className="flex items-end">
                <Button onClick={handleAdd} disabled={loading || isSaving || !newName.trim() || newTypeId === ''}>
                  {isSaving ? 'Enregistrement...' : 'Ajouter'}
                </Button>
              </div>
            </div>

            {formError && <div className="mt-2 text-sm text-red-600" role="alert">{formError}</div>}
          </CardContent>
        </Card>

        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Familles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Famille</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Chargement...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : families.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">Aucune famille trouvée.</TableCell>
                      </TableRow>
                    ) : (
                      families.map(f => (
                        <TableRow key={f.id}>
                          <TableCell>{f.id}</TableCell>
                          <TableCell>
                            {editingId === f.id ? (
                              <>
                                <Input
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  aria-invalid={!!errors.famille}
                                  aria-describedby={errors.famille ? `famille-edit-error-${f.id}` : undefined}
                                />
                                {editingId === f.id && errors.famille && (
                                  <p id={`famille-edit-error-${f.id}`} className="text-xs text-red-600 mt-1">{errors.famille[0]}</p>
                                )}
                              </>
                            ) : (
                              f.famille
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === f.id ? (
                              <>
                                <select
                                  className="input"
                                  value={editTypeId}
                                  onChange={e => setEditTypeId(e.target.value === '' ? '' : Number(e.target.value))}
                                  aria-invalid={!!errors.type_id}
                                  aria-describedby={errors.type_id ? `type-edit-error-${f.id}` : undefined}
                                >
                                  <option value="">-- Type --</option>
                                  {types.map(t => <option key={t.id} value={t.id}>{t.type ?? t.nom}</option>)}
                                </select>
                                {editingId === f.id && errors.type_id && (
                                  <p id={`type-edit-error-${f.id}`} className="text-xs text-red-600 mt-1">{errors.type_id[0]}</p>
                                )}
                              </>
                            ) : (
                              f.type?.type ?? '-'
                            )}
                          </TableCell>
                          <TableCell className="flex gap-2">
                            {editingId === f.id ? (
                              <>
                                <Button onClick={() => handleSaveEdit(f.id)} disabled={loading || isSaving}>
                                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                                <Button variant="ghost" onClick={() => setEditingId(null)} disabled={loading || isSaving}>Annuler</Button>
                              </>
                            ) : (
                              <>
                                <Button onClick={() => startEdit(f)} disabled={loading || isSaving}><Edit className="w-3 h-3" /></Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={loading || isSaving}><Trash2 className="w-3 h-3" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(f.id)} disabled={isSaving}>Supprimer</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {formError && <div className="mt-3 text-sm text-red-600" role="alert">{formError}</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

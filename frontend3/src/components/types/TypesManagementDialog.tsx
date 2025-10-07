// src/components/types/TypesManagementDialog.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
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
import { getTypes, createType, updateType, deleteType } from '../types/types-api';
import type { AxiosError } from 'axios';

type ValidationErrors = Record<string, string[]>;

interface TypesManagementDialogProps {
  onSaved?: () => void; // appelé après add/update/delete pour rafraîchir ailleurs si besoin
}

const normalizeAxiosData = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  const keys = ['items', 'results', 'rows', 'types'];
  for (const k of keys) if (Array.isArray(data[k])) return data[k];
  const vals = Object.values(data).filter(v => Array.isArray(v));
  if (vals.length > 0) return vals[0];
  return [];
};

export default function TypesManagementDialog({ onSaved }: TypesManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<{ id: number; type?: string; nom?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newType, setNewType] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErrors({});
    setFormError(null);
    try {
      const resp = await getTypes();
      setTypes(normalizeAxiosData(resp));
    } catch (err) {
      console.error('Types load failed', err);
      setTypes([]);
      setFormError('Erreur lors du chargement des types.');
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
    if (!newType.trim()) {
      setErrors({ type: ['Le nom du type est requis.'] });
      return;
    }

    setIsSaving(true);
    try {
      await createType({ type: newType });
      setNewType('');
      await load();
      onSaved?.();
    } catch (err) {
      console.error('createType failed', err);
      const axiosErr = err as AxiosError<any>;
      const resp = axiosErr.response;
      if (resp && resp.status === 422) {
        const validationErrors: ValidationErrors =
          resp.data?.errors ?? (typeof resp.data === 'object' ? resp.data : {});
        setErrors(validationErrors);
        if (resp.data?.message) setFormError(String(resp.data.message));
      } else {
        setFormError('Erreur lors de la création du type.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (id: number) => {
    setErrors({});
    setFormError(null);
    if (!editValue.trim()) {
      setErrors({ type: ['Le nom du type est requis.'] });
      return;
    }

    setIsSaving(true);
    try {
      await updateType(id, { type: editValue });
      setEditingId(null);
      setEditValue('');
      await load();
      onSaved?.();
    } catch (err) {
      console.error('updateType failed', err);
      const axiosErr = err as AxiosError<any>;
      const resp = axiosErr.response;
      if (resp && resp.status === 422) {
        const validationErrors: ValidationErrors =
          resp.data?.errors ?? (typeof resp.data === 'object' ? resp.data : {});
        setErrors(validationErrors);
        if (resp.data?.message) setFormError(String(resp.data.message));
      } else {
        setFormError('Erreur lors de la mise à jour du type.');
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
      await deleteType(id);
      await load();
      onSaved?.();
    } catch (err) {
      console.error('deleteType failed', err);
      setFormError('Erreur lors de la suppression du type.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Gérer Types
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des Types</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Ajoute, modifie ou supprime les types — identique au style des autres formulaires.
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-3">
          <CardHeader>
            <CardTitle>Ajouter un type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Nom du type"
                value={newType}
                onChange={e => setNewType(e.target.value)}
                aria-invalid={!!errors.type}
                aria-describedby={errors.type ? 'type-error' : undefined}
              />
              <Button onClick={handleAdd} disabled={loading || isSaving || !newType.trim()}>
                {isSaving ? 'Enregistrement...' : 'Ajouter'}
              </Button>
            </div>
            {errors.type && <p id="type-error" className="text-xs text-red-600 mt-2">{errors.type[0]}</p>}
            {formError && <div className="mt-2 text-sm text-red-600" role="alert">{formError}</div>}
          </CardContent>
        </Card>

        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Chargement...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : types.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">Aucun type trouvé.</TableCell>
                      </TableRow>
                    ) : (
                      types.map(t => (
                        <TableRow key={t.id}>
                          <TableCell>{t.id}</TableCell>
                          <TableCell>
                            {editingId === t.id ? (
                              <>
                                <Input
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  aria-invalid={!!errors.type}
                                  aria-describedby={editingId === t.id && errors.type ? `type-edit-error-${t.id}` : undefined}
                                />
                                {editingId === t.id && errors.type && (
                                  <p id={`type-edit-error-${t.id}`} className="text-xs text-red-600 mt-1">{errors.type[0]}</p>
                                )}
                              </>
                            ) : (
                              t.type ?? t.nom ?? '—'
                            )}
                          </TableCell>
                          <TableCell className="flex gap-2">
                            {editingId === t.id ? (
                              <>
                                <Button onClick={() => handleSave(t.id)} disabled={loading || isSaving}>
                                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                                <Button variant="ghost" onClick={() => { setEditingId(null); setEditValue(''); }} disabled={loading || isSaving}>Annuler</Button>
                              </>
                            ) : (
                              <>
                                <Button onClick={() => { setEditingId(t.id); setEditValue(t.type ?? t.nom ?? ''); }} disabled={loading || isSaving}>
                                  <Edit className="w-3 h-3" />
                                </Button>

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
                                      <AlertDialogAction onClick={() => handleDelete(t.id)} disabled={isSaving}>Supprimer</AlertDialogAction>
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

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import type { AxiosError } from "axios";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  User as ApiUser,
} from "./utilisateurs-api";

import { getCliniques, Clinique } from "../cliniques/cliniques-api";

/* ---------- Local types ---------- */
type ValidationErrors = Record<string, string[]>;

interface UserFormData {
  name: string;
  email: string;
  password: string; // optional on update
  role: "admin" | "user";
  clinique_ids: number[]; // sélection multiple
}

/* ---------- Component ---------- */
export function UserManagement() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "user",
    clinique_ids: [],
  });

  /* ---------- Load users + cliniques ---------- */
  const loadUsers = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadUsers error", err);
      setUsers([]);
      setGlobalError("Erreur lors du chargement des utilisateurs.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCliniques = async () => {
    try {
      const data = await getCliniques();
      setCliniques(data);
    } catch (err) {
      console.error("loadCliniques error", err);
      // keep cliniques as-is but set a global error
      setGlobalError((prev) => prev ?? "Erreur lors du chargement des cliniques.");
    }
  };

  useEffect(() => {
    // initial load
    (async () => {
      await Promise.all([loadUsers(), loadCliniques()]);
    })();
  }, []);

  // refresh all (users + cliniques)
  const refreshAll = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const [u, c] = await Promise.all([getUsers(), getCliniques()]);
      setUsers(Array.isArray(u) ? u : []);
      setCliniques(Array.isArray(c) ? c : []);
    } catch (err) {
      console.error("refreshAll error", err);
      setGlobalError("Erreur lors du rafraîchissement.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- Validation ---------- */
  const validate = (): boolean => {
    const v: ValidationErrors = {};
    if (!formData.name.trim()) v.name = ["Le nom est requis."];
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) v.email = ["Email invalide."];
    if (!selectedUser && formData.password.length < 6)
      v.password = ["Le mot de passe est requis (min 6)."];
    if (!["admin", "user"].includes(formData.role)) v.role = ["Rôle invalide."];
    setErrors(v);
    return Object.keys(v).length === 0;
  };

  /* ---------- Open / Close dialog helpers ---------- */
  const openCreateDialog = () => {
    setSelectedUser(null);
    setFormData({ name: "", email: "", password: "", role: "user", clinique_ids: [] });
    setErrors({});
    setFormError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: ApiUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name ?? "",
      email: user.email ?? "",
      password: "",
      role: (user.role as "admin" | "user") ?? "user",
      clinique_ids: user.cliniques?.map((c) => c.id) ?? [],
    });
    setErrors({});
    setFormError(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setFormData({ name: "", email: "", password: "", role: "user", clinique_ids: [] });
    setErrors({});
    setFormError(null);
  };

  /* ---------- Submit (create / update) ---------- */
  const handleSubmit = async () => {
    if (!validate() || isSaving) return;

    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      clinique_ids: formData.clinique_ids,
      ...(formData.password ? { password: formData.password } : {}),
    };

    setIsSaving(true);
    setFormError(null);
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, payload);
      } else {
        await createUser(payload as any);
      }
      await loadUsers();
      closeDialog();
    } catch (err: any) {
      console.error("save error", err);
      const aErr = err as AxiosError & any;
      if (aErr?.response?.data?.errors) setErrors(aErr.response.data.errors);
      else setFormError("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- Delete ---------- */
  const handleDelete = async (id: number) => {
    const old = users;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      await deleteUser(id);
    } catch (err) {
      console.error("delete error", err);
      setUsers(old); // rollback
      setGlobalError("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Gestion des Utilisateurs</h1>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshAll()}
            title="Rafraîchir"
            aria-label="Rafraîchir les utilisateurs"
            disabled={isLoading || isSaving}
            className="p-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} disabled={isLoading || isSaving}>
                <Plus className="w-4 h-4 mr-2" /> Nouvel utilisateur
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedUser ? "Modifier Utilisateur" : "Ajouter Utilisateur"}</DialogTitle>
                <DialogDescription>
                  {selectedUser ? "Modifiez les infos et les cliniques assignées." : "Créez un utilisateur et assignez ses cliniques."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 mt-4">
                {/* Nom */}
                <div>
                  <Label>Nom</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  {errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}
                </div>

                {/* Email */}
                <div>
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  {errors.email && <p className="text-xs text-red-600">{errors.email[0]}</p>}
                </div>

                {/* Mot de passe */}
                <div>
                  <Label>Mot de passe {selectedUser ? "(laisser vide)" : ""}</Label>
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  {errors.password && <p className="text-xs text-red-600">{errors.password[0]}</p>}
                </div>

                {/* Rôle */}
                <div>
                  <Label>Rôle</Label>
                  <select
                    className="input w-full border rounded p-2"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "user" })}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  {errors.role && <p className="text-xs text-red-600">{errors.role[0]}</p>}
                </div>

                {/* Cliniques */}
                <div>
                  <Label>Cliniques</Label>
                  <div className="space-y-2 mt-2">
                    {cliniques.map((c) => {
                      const checked = formData.clinique_ids.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setFormData((prev) => {
                                const ids = checked
                                  ? prev.clinique_ids.filter((id) => id !== c.id) // remove
                                  : [...prev.clinique_ids, c.id]; // add
                                return { ...prev, clinique_ids: ids };
                              });
                            }}
                          />
                          <span>{c.nom}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {formError && <div className="text-sm text-red-600">{formError}</div>}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={closeDialog} disabled={isSaving}>Annuler</Button>
                  <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? "Enregistrement..." : selectedUser ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {globalError && <div className="text-sm text-red-600" role="status" aria-live="polite">{globalError}</div>}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Cliniques</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Chargement...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Aucun utilisateur.</TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.cliniques?.map((c) => c.nom).join(", ") || "—"}</TableCell>
                    <TableCell className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(u)} disabled={isLoading || isSaving}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" disabled={isLoading || isSaving}><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(u.id)}>Supprimer</AlertDialogAction>
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
    </div>
  );
}

export default UserManagement;

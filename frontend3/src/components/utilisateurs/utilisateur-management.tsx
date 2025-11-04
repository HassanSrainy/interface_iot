import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
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
import { TablePagination } from "../ui/table-pagination";
import { Plus, Edit, Trash2, RefreshCw, User, Users, Shield, Mail, Building2, X } from "lucide-react";
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
  
  // ✅ NOUVEAU : État pour l'utilisateur connecté
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

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
      setGlobalError((prev) => prev ?? "Erreur lors du chargement des cliniques.");
    }
  };

  useEffect(() => {
    // ✅ NOUVEAU : Récupérer l'utilisateur connecté depuis localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

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
      setGlobalError(null);
    } catch (err: any) {
      console.error("delete error", err);
      setUsers(old); // rollback
      
      // ✅ MODIFIÉ : Extraire le message d'erreur du serveur
      const errorMessage = err?.response?.data?.message || "Erreur lors de la suppression.";
      setGlobalError(errorMessage);
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.role?.toLowerCase().includes(search) ||
      u.cliniques?.some((c) => c.nom.toLowerCase().includes(search))
    );
  });

  // Statistics
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    users: users.filter((u) => u.role === "user").length,
    withClinics: users.filter((u) => u.cliniques && u.cliniques.length > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
          <p className="text-slate-600 mt-1">Gérez les utilisateurs et leurs accès aux cliniques</p>
        </div>

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
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                      {cliniques.map((c) => {
                        const checked = formData.clinique_ids.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setFormData((prev) => {
                                  const ids = checked
                                    ? prev.clinique_ids.filter((id) => id !== c.id)
                                    : [...prev.clinique_ids, c.id];
                                  return { ...prev, clinique_ids: ids };
                                });
                              }}
                              className="cursor-pointer"
                            />
                            <span>{c.nom}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {formError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{formError}</div>}

                  <div className="flex justify-end space-x-2 pt-4 border-t">
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Utilisateurs</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administrateurs</p>
              <p className="text-3xl font-bold text-purple-700 mt-2">{stats.admins}</p>
            </div>
            <div className="rounded-full bg-purple-100 p-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Utilisateurs</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{stats.users}</p>
            </div>
            <div className="rounded-full bg-green-100 p-4">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avec Cliniques</p>
              <p className="text-3xl font-bold text-orange-700 mt-2">{stats.withClinics}</p>
            </div>
            <div className="rounded-full bg-orange-100 p-4">
              <Building2 className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border-2 border-red-200 flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2">
            <X className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Erreur</p>
            <p className="text-sm mt-1">{globalError}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setGlobalError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <Input
            placeholder="🔍 Rechercher par nom, email, rôle ou clinique..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 text-base"
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Liste des utilisateurs</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} 
                {searchTerm && ` trouvé${filteredUsers.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 hover:bg-slate-100">
                  <TableHead className="font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-slate-500" />
                      Utilisateur
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-slate-500" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-slate-500" />
                      Rôle
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-slate-500" />
                      Cliniques
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                        <p className="text-sm font-medium text-slate-600">Chargement des utilisateurs...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="rounded-full bg-slate-100 p-4">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-base font-medium text-slate-700">Aucun utilisateur trouvé</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {searchTerm ? "Essayez de modifier votre recherche" : "Commencez par créer un utilisateur"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            style={{
                              display: 'flex',
                              height: '28px',
                              width: '28px',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '9999px',
                              background: 'linear-gradient(to bottom right, #1f2937, #111827)',
                              color: '#ffffff',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.2)',
                              opacity: '0.8'
                            }}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">ID: {u.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700">{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={u.role === "admin" ? "default" : "secondary"}
                          className={u.role === "admin" 
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 flex items-center gap-1 w-fit" 
                            : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 flex items-center gap-1 w-fit"
                          }
                        >
                          <Shield className="h-3 w-3 flex-shrink-0" />
                          <span>{u.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.cliniques && u.cliniques.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.cliniques.map((c, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {c.nom}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">Aucune clinique</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openEditDialog(u)} 
                            disabled={isLoading || isSaving}
                            className="hover:bg-blue-50 hover:border-blue-200"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          
                          {currentUser?.id !== u.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  disabled={isLoading || isSaving}
                                  className="hover:bg-red-50 hover:border-red-200"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
                                  <p className="text-sm text-slate-600">
                                    Êtes-vous sûr de vouloir supprimer <strong>{u.name}</strong> ? Cette action est irréversible.
                                  </p>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(u.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t bg-slate-50 px-6 py-4">
            <TablePagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemLabel="utilisateurs"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserManagement;
// frontend3/src/components/sensors/SensorManagement.tsx
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog';
import { Plus, Edit, Trash2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import type { AxiosError } from 'axios';

// ---- imports API (tes helpers existants) ----
import { getSensors, createSensor, updateSensor, deleteSensor } from './sensor-api';
import { getFamilies } from '../familles/familles-api';
import { getCliniques } from '../cliniques/cliniques-api';
import { getFloors, getFloorsByClinique } from '../floors/floors-api';
import { getServices, getServicesByFloor } from '../services/services-api';

/* ---------- Types ---------- */
export interface Clinique { id: number; nom: string; adresse?: string }
export interface Floor { id: number; nom: string; clinique_id?: number; clinique?: Clinique }
export interface Service { id: number; nom: string; floor_id?: number; floor?: Floor }
export interface Famille { id: number; famille: string; type?: { id: number; type: string } }
export interface Mesure { id: number; valeur: number; date_mesure: string }
export interface Alerte { id: number; type: string; valeur: number; date: string; statut: string }
export interface Sensor {
  id: number;
  matricule: string;
  date_installation?: string | null;
  date_derniere_connexion?: string | null;
  date_derniere_deconnexion?: string | null;
  seuil_min?: number | null;
  seuil_max?: number | null;
  adresse_ip?: string | null;
  adresse_mac?: string | null;
  famille?: Famille | null;
  service?: Service | null;
  mesures?: Mesure[];
  alertes?: Alerte[];
}

type ValidationErrors = Record<string, string[]>;

interface SensorManagementProps {
  // optionally parent may pass cliniques; if not, component loads them
  cliniques?: Clinique[];
}

/* ---------- Form data type (typed to avoid implicit any) ---------- */
interface SensorFormData {
  matricule: string;
  seuil_min: number | '';
  seuil_max: number | '';
  adresse_ip: string;
  adresse_mac: string;
  famille_id: number | '';
  clinique_id: number | '';
  floor_id: number | '';
  service_id: number | '';
  date_installation: string | null;
}

/* ---------- Helper to normalize axios-like responses ---------- */
const normalizeAxiosData = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  const keys = ['items', 'results', 'familles', 'floors', 'services', 'rows'];
  for (const k of keys) if (Array.isArray(data[k])) return data[k];
  const vals = Object.values(data).filter(v => Array.isArray(v));
  if (vals.length > 0) return vals[0];
  console.warn('normalizeAxiosData: unexpected shape', data);
  return [];
};

/* ---------- Component ---------- */
export function SensorManagement({ cliniques = [] }: SensorManagementProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);

  const [formData, setFormData] = useState<SensorFormData>({
    matricule: '',
    seuil_min: 0,
    seuil_max: 100,
    adresse_ip: '',
    adresse_mac: '',
    famille_id: '',
    clinique_id: '',
    floor_id: '',
    service_id: '',
    date_installation: null
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // option lists
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [servicesOptions, setServicesOptions] = useState<Service[]>([]);
  // local cliniques fallback (we always load from API into this)
  const [localCliniques, setLocalCliniques] = useState<Clinique[]>([]);

  /* ---------- Load initial data ---------- */
  useEffect(() => {
    loadSensors();
    loadFamilles();
    // we load cliniques when dialog opens (see useEffect below)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload cliniques / familles each time dialog opens (fresh data)
  useEffect(() => {
    if (isAddOpen) {
      loadCliniques();
      loadFamilles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddOpen]);

  const loadSensors = async () => {
    try {
      const data = await getSensors();
      setSensors(normalizeAxiosData(data));
    } catch (err) {
      console.error('Erreur loadSensors', err);
      setSensors([]);
    }
  };

  const loadFamilles = async () => {
    try {
      const resp = await getFamilies();
      const arr = normalizeAxiosData(resp);
      setFamilles(arr);
      console.debug('familles loaded', arr);
    } catch (err) {
      console.error('Impossible de charger familles', err);
      setFamilles([]);
    }
  };

  // now using getCliniques helper directly
  const loadCliniques = async () => {
    try {
      const resp = await getCliniques();
      const arr = normalizeAxiosData(resp);
      setLocalCliniques(arr);
      console.debug('cliniques loaded (local)', arr);
    } catch (err) {
      console.error('Impossible de charger cliniques', err);
      setLocalCliniques([]);
    }
  };

  /* ---------- Floors and Services with fallback strategies (use your helpers) ---------- */
  const loadFloorsForClinique = async (cliniqueId: number | string) => {
    if (!cliniqueId) {
      setFloors([]);
      setServicesOptions([]);
      return;
    }

    // preferred: dedicated endpoint helper getFloorsByClinique
    if (typeof getFloorsByClinique === 'function') {
      try {
        const resp = await getFloorsByClinique(Number(cliniqueId));
        const arr = normalizeAxiosData(resp);
        setFloors(arr);
        console.debug(`floors (by clinique) for ${cliniqueId}`, arr);
        return;
      } catch (err) {
        console.debug('getFloorsByClinique failed, fallback...', err);
      }
    }

    // fallback: getFloors then filter
    if (typeof getFloors === 'function') {
      try {
        const resp = await getFloors();
        const arr = normalizeAxiosData(resp);
        const filtered = arr.filter((f: any) => String(f.clinique_id ?? f.clinique?.id ?? '') === String(cliniqueId));
        setFloors(filtered);
        console.debug('floors fetched+filtered for clinique', filtered);
        return;
      } catch (err) {
        console.debug('getFloors failed', err);
      }
    }

    setFloors([]);
  };

  const loadServicesForFloor = async (floorId: number | string) => {
    if (!floorId) {
      setServicesOptions([]);
      return;
    }

    if (typeof getServicesByFloor === 'function') {
      try {
        const resp = await getServicesByFloor(Number(floorId));
        const arr = normalizeAxiosData(resp);
        setServicesOptions(arr);
        console.debug(`services (by floor) for ${floorId}`, arr);
        return;
      } catch (err) {
        console.debug('getServicesByFloor failed, fallback...', err);
      }
    }

    if (typeof getServices === 'function') {
      try {
        const resp = await getServices();
        const arr = normalizeAxiosData(resp);
        const filtered = arr.filter((s: any) => String(s.floor_id ?? s.floor?.id ?? '') === String(floorId));
        setServicesOptions(filtered);
        console.debug('services fetched+filtered for floor', filtered);
        return;
      } catch (err) {
        console.debug('getServices failed', err);
      }
    }

    setServicesOptions([]);
  };

  /* ---------- Client validation ---------- */
  const validateClient = (): boolean => {
    const v: ValidationErrors = {};
    if (!formData.matricule || String(formData.matricule).trim() === '') v.matricule = ['Le matricule est requis.'];
    if (!formData.famille_id) v.famille_id = ['La famille est requise.'];
    if (!formData.clinique_id) v.clinique_id = ['La clinique est requise.'];
    if (!formData.floor_id) v.floor_id = ['L\'étage est requis.'];
    if (!formData.service_id) v.service_id = ['Le service est requis.'];
    if (formData.adresse_ip && !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(formData.adresse_ip)) v.adresse_ip = ['IP invalide.'];
    if (formData.adresse_mac && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.adresse_mac)) v.adresse_mac = ['MAC invalide.'];
    if (Number(formData.seuil_min) > Number(formData.seuil_max)) {
      v.seuil_min = ['Le seuil min doit être <= seuil max'];
      v.seuil_max = ['Le seuil max doit être >= seuil min'];
    }
    setErrors(v);
    return Object.keys(v).length === 0;
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    setFormError(null);
    setErrors({});
    if (!validateClient()) return;

    const payload = {
      matricule: formData.matricule,
      seuil_min: formData.seuil_min !== '' ? formData.seuil_min : null,
      seuil_max: formData.seuil_max !== '' ? formData.seuil_max : null,
      adresse_ip: formData.adresse_ip || null,
      adresse_mac: formData.adresse_mac || null,
      famille_id: formData.famille_id || null,
      service_id: formData.service_id || null,
      date_installation: formData.date_installation || null
    };

    try {
      if (editingSensor) {
        await updateSensor(editingSensor.id, payload);
      } else {
        await createSensor(payload);
      }
      await loadSensors();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error('Erreur sauvegarde capteur', err);
      const axiosErr = err as AxiosError<any>;
      const resp = axiosErr.response;
      if (resp && resp.status === 422) {
        const validationErrors: ValidationErrors =
          resp.data?.errors ?? (typeof resp.data === 'object' ? resp.data : {});
        setErrors(validationErrors);
        if (resp.data?.message) setFormError(String(resp.data.message));
        return;
      }
      setFormError('Erreur lors de la sauvegarde. Voir console.');
    }
  };

  const handleDeleteSensor = async (id: number) => {
    try {
      await deleteSensor(id);
      setSensors(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Erreur suppression', err);
    }
  };

  /* ---------- Edit / Reset ---------- */
  const handleEdit = (sensor: Sensor) => {
    // robust fallback to get clinique id from various possible shapes
    const cliniqueIdFromSensor =
      (sensor as any).clinique_id ??
      sensor.service?.floor?.clinique?.id ??
      '';

    setFormData({
      matricule: sensor.matricule ?? '',
      seuil_min: sensor.seuil_min ?? 0,
      seuil_max: sensor.seuil_max ?? 100,
      adresse_ip: sensor.adresse_ip ?? '',
      adresse_mac: sensor.adresse_mac ?? '',
      famille_id: sensor.famille?.id ?? '',
      clinique_id: (cliniqueIdFromSensor as number) ?? '',
      floor_id: sensor.service?.floor?.id ?? '',
      service_id: sensor.service?.id ?? '',
      date_installation: sensor.date_installation ?? null
    });

    // preload dependent selects
    if (cliniqueIdFromSensor) loadFloorsForClinique(cliniqueIdFromSensor);
    if (sensor.service?.floor?.id) loadServicesForFloor(sensor.service.floor.id);

    setErrors({});
    setFormError(null);
    setEditingSensor(sensor);
    setIsAddOpen(true);
  };

  const resetForm = () => {
    setFormData({
      matricule: '',
      seuil_min: 0,
      seuil_max: 100,
      adresse_ip: '',
      adresse_mac: '',
      famille_id: '',
      clinique_id: '',
      floor_id: '',
      service_id: '',
      date_installation: null
    });
    setErrors({});
    setFormError(null);
    setEditingSensor(null);
    setFloors([]);
    setServicesOptions([]);
  };

  /* ---------- Status icon ---------- */
  const getStatusIcon = (sensor: Sensor) => {
    const lastConn = sensor.date_derniere_connexion ? new Date(sensor.date_derniere_connexion) : null;
    const lastDisconn = sensor.date_derniere_deconnexion ? new Date(sensor.date_derniere_deconnexion) : null;
    if (!lastConn || (lastDisconn && lastConn < lastDisconn)) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (sensor.alertes?.some(a => a.type === 'high' || a.type === 'low')) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  /* ---------- UI ---------- */
  // Force use of cliniques loaded from API to avoid stale prop
  const clinicsToRender = localCliniques;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Gestion des Capteurs</h1>
          <p className="text-muted-foreground">Gérez vos capteurs IoT et leurs mesures</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Capteur
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto" aria-describedby="capteur-form-description">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">{editingSensor ? 'Modifier Capteur' : 'Ajouter Capteur'}</DialogTitle>
              <DialogDescription id="capteur-form-description" className="text-sm text-muted-foreground">
                Remplissez les champs du formulaire pour {editingSensor ? 'modifier' : 'ajouter'} un capteur.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <Label htmlFor="matricule">Matricule</Label>
                <Input id="matricule" value={formData.matricule} onChange={e => setFormData({ ...formData, matricule: e.target.value })} />
                {errors.matricule && <p className="text-xs text-red-600 mt-1">{errors.matricule[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="famille">Famille</Label>
                <select id="famille" className="input w-full" value={formData.famille_id ?? ''} onChange={e => setFormData({ ...formData, famille_id: e.target.value === '' ? '' : Number(e.target.value) })}>
                  <option value="">-- Choisir une famille --</option>
                  {familles.map(f => <option key={f.id} value={f.id}>{f.famille}{f.type ? ` (${f.type.type})` : ''}</option>)}
                </select>
                {errors.famille_id && <p className="text-xs text-red-600 mt-1">{errors.famille_id[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="clinique">Clinique</Label>
                <select
                  id="clinique"
                  className="input w-full"
                  value={formData.clinique_id ?? ''}
                  onChange={e => {
                    const raw = e.target.value;
                    const val = raw === '' ? '' : Number(raw);
                    setFormData(prev => ({ ...prev, clinique_id: val, floor_id: '', service_id: '' }));
                    if (val !== '') loadFloorsForClinique(val);
                    else {
                      setFloors([]);
                      setServicesOptions([]);
                    }
                  }}
                >
                  <option value="">-- Choisir une clinique --</option>
                  {clinicsToRender.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                {errors.clinique_id && <p className="text-xs text-red-600 mt-1">{errors.clinique_id[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="floor">Étage (Floor)</Label>
                <select id="floor" className="input w-full" value={formData.floor_id ?? ''} onChange={e => {
                  const raw = e.target.value;
                  const val = raw === '' ? '' : Number(raw);
                  setFormData({ ...formData, floor_id: val, service_id: '' });
                  if (val !== '') loadServicesForFloor(val);
                  else setServicesOptions([]);
                }}>
                  <option value="">-- Choisir un étage --</option>
                  {floors.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
                {errors.floor_id && <p className="text-xs text-red-600 mt-1">{errors.floor_id[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="service">Service</Label>
                <select id="service" className="input w-full" value={formData.service_id ?? ''} onChange={e => setFormData({ ...formData, service_id: e.target.value === '' ? '' : Number(e.target.value) })}>
                  <option value="">-- Choisir un service --</option>
                  {servicesOptions.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
                {errors.service_id && <p className="text-xs text-red-600 mt-1">{errors.service_id[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="adresse_ip">Adresse IP</Label>
                <Input id="adresse_ip" placeholder="192.168.1.100" value={formData.adresse_ip} onChange={e => setFormData({ ...formData, adresse_ip: e.target.value })} />
                {errors.adresse_ip && <p className="text-xs text-red-600 mt-1">{errors.adresse_ip[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="adresse_mac">Adresse MAC</Label>
                <Input id="adresse_mac" placeholder="00:1A:2B:3C:4D:5E" value={formData.adresse_mac} onChange={e => setFormData({ ...formData, adresse_mac: e.target.value })} />
                {errors.adresse_mac && <p className="text-xs text-red-600 mt-1">{errors.adresse_mac[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="seuil_min">Seuil min</Label>
                <Input id="seuil_min" type="number" value={formData.seuil_min} onChange={e => setFormData({ ...formData, seuil_min: e.target.value === '' ? '' : Number(e.target.value) })} />
                {errors.seuil_min && <p className="text-xs text-red-600 mt-1">{errors.seuil_min[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="seuil_max">Seuil max</Label>
                <Input id="seuil_max" type="number" value={formData.seuil_max} onChange={e => setFormData({ ...formData, seuil_max: e.target.value === '' ? '' : Number(e.target.value) })} />
                {errors.seuil_max && <p className="text-xs text-red-600 mt-1">{errors.seuil_max[0]}</p>}
              </div>
            </div>

            {formError && <div className="mt-3 text-sm text-red-600">{formError}</div>}

            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Annuler</Button>
              <Button onClick={handleSubmit}>{editingSensor ? 'Modifier' : 'Ajouter'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Capteurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Matricule</TableHead>
                <TableHead className="font-medium">Famille</TableHead>
                <TableHead className="font-medium">Service</TableHead>
                <TableHead className="font-medium">Réseau (IP / MAC)</TableHead>
                <TableHead className="font-medium">Seuils</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sensors.map(sensor => (
                <TableRow key={sensor.id} className="hover:bg-muted/5">
                  <TableCell className="font-medium">{sensor.matricule}</TableCell>

                  <TableCell className="text-xs font-mono">
                    {sensor.famille?.famille} <span className="text-muted-foreground">({sensor.famille?.type?.type})</span>
                  </TableCell>

                  <TableCell className="text-xs">
                    <div className="flex flex-col text-xs">
                      <span className="font-medium">{sensor.service?.nom}</span>
                      <span className="text-muted-foreground">{sensor.service?.floor?.nom} — {sensor.service?.floor?.clinique?.nom}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">{sensor.adresse_ip ?? '—'}</span>
                      <span className="text-xs text-gray-500">{sensor.adresse_mac ?? '—'}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs">
                    <div>
                      <div className="text-orange-600">Min: {sensor.seuil_min ?? '—'}</div>
                      <div className="text-red-600">Max: {sensor.seuil_max ?? '—'}</div>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs">
                    <div className="flex items-center space-x-2">{getStatusIcon(sensor)}</div>
                  </TableCell>

                  <TableCell className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(sensor)}>
                      <Edit className="w-3 h-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline"><Trash2 className="w-3 h-3" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le capteur</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSensor(sensor.id)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

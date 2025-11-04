import { useEffect, useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CustomSelect, CustomSelectItem } from '../ui/custom-select';
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
import { ModernPagination } from '../ui/modern-pagination';
import { TablePagination } from '../ui/table-pagination';
import { PageLayout } from '../layout/PageLayout';
import { FilterBar } from '../layout/FilterBar';
import { Plus, Edit, Trash2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { AxiosError } from 'axios';
import { UnitSelector } from './UnitSelector';
import { UnitDisplay } from './UnitDisplay';

// ---- imports API (tes helpers existants) ----
import { getSensors, createSensor, updateSensor, deleteSensor } from './sensor-api';
import { getFamilies } from '../familles/familles-api';
import { getCliniques } from '../cliniques/cliniques-api';
import { getFloors, getFloorsByClinique } from '../floors/floors-api';
import { getServices, getServicesByFloor } from '../services/services-api';
// imports pour ouvrir les modals de gestion ( Types / Familles )
import TypesManagementDialog from '../types/TypesManagementDialog';
import FamillesManagementDialog from '../familles/FamillesManagementDialog';

// Import React Query hooks for role-based filtering
import { useSensors } from '../../queries/sensors';
import { useCliniques } from '../../queries/cliniques';


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
  unite?: string | null;
  famille?: Famille | null;
  service?: Service | null;
  mesures?: Mesure[];
  alertes?: Alerte[];
  derniere_mesure?: {
    id?: number;
    valeur: number;
    date_mesure: string;
  } | null;
  status?: 'online' | 'offline' | null;
}


type ValidationErrors = Record<string, string[]>;

interface SensorManagementProps {
  cliniques?: Clinique[];
}

interface SensorFormData {
  matricule: string;
  seuil_min: number | '';
  seuil_max: number | '';
  adresse_ip: string;
  adresse_mac: string;
  unite: string;
  famille_id: number | '';
  clinique_id: number | '';
  floor_id: number | '';
  service_id: number | '';
  date_installation: string | null;
}

const normalizeAxiosData = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  const keys = ['items', 'results', 'familles', 'floors', 'services', 'rows', 'sensors'];
  for (const k of keys) if (Array.isArray(data[k])) return data[k];
  const vals = Object.values(data).filter(v => Array.isArray(v));
  if (vals.length > 0) return vals[0];
  console.warn('normalizeAxiosData: unexpected shape', data);
  return [];
};

export function SensorManagement({ cliniques = [] }: SensorManagementProps) {
  // Use React Query hooks for automatic role-based filtering
  const { data: sensorsData = [], isLoading: sensorsLoading, refetch: refetchSensors } = useSensors();
  const { data: cliniquesData = [], refetch: refetchCliniques } = useCliniques();
  
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);

  const [formData, setFormData] = useState<SensorFormData>({
    matricule: '',
    seuil_min: 0,
    seuil_max: 100,
    adresse_ip: '',
    adresse_mac: '',
    unite: '',
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
  const [localCliniques, setLocalCliniques] = useState<Clinique[]>([]);

  // loading / saving / global error
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // --------- search / filter / sort / pagination / group-by state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'matricule' | 'famille' | 'service' | 'status' | 'derniere_mesure'>('matricule');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1); // Changed from pageIndex (0-based) to currentPage (1-based)
  const [groupBy, setGroupBy] = useState<'none' | 'famille' | 'service' | 'clinique'>('none');

  const familyOptions = useMemo(() => {
    const s = new Set<string>();
    sensors.forEach(sen => {
      const fam = sen.famille?.famille ?? '';
      if (fam) s.add(fam);
    });
    return ['all', ...Array.from(s)];
  }, [sensors]);

  const filteredSensors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sensors.filter(s => {
      if (filterStatus !== 'all') {
        const st = String(s.status ?? '').toLowerCase();
        if (filterStatus === 'online' && st !== 'online') return false;
        if (filterStatus === 'offline' && st === 'online') return false;
      }
      if (filterFamily !== 'all') {
        const fam = s.famille?.famille ?? '';
        if (fam !== filterFamily) return false;
      }
      if (q === '') return true;
      return (
        String(s.matricule ?? '').toLowerCase().includes(q) ||
        String(s.famille?.famille ?? '').toLowerCase().includes(q) ||
        String(s.service?.nom ?? '').toLowerCase().includes(q) ||
        String(s.service?.floor?.clinique?.nom ?? '').toLowerCase().includes(q)
      );
    });
  }, [sensors, searchTerm, filterStatus, filterFamily]);

  const sortedSensors = useMemo(() => {
    const arr = [...filteredSensors];
    arr.sort((a, b) => {
      let va: any = a[sortKey as keyof Sensor];
      let vb: any = b[sortKey as keyof Sensor];
      if (sortKey === 'famille') {
        va = a.famille?.famille ?? '';
        vb = b.famille?.famille ?? '';
      }
      if (sortKey === 'service') {
        va = a.service?.nom ?? '';
        vb = b.service?.nom ?? '';
      }
      if (sortKey === 'derniere_mesure') {
        va = a.derniere_mesure?.date_mesure ?? '';
        vb = b.derniere_mesure?.date_mesure ?? '';
      }
      if (va == null) va = '';
      if (vb == null) vb = '';

      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? (Number(va) - Number(vb)) : (Number(vb) - Number(va));
    });
    return arr;
  }, [filteredSensors, sortKey, sortDir]);

  const groupedSensors = useMemo(() => {
    if (groupBy === 'none') return { '': sortedSensors };

    const groups: Record<string, Sensor[]> = {};
    sortedSensors.forEach(s => {
      let key = '';
      if (groupBy === 'famille') key = s.famille?.famille ?? 'Sans famille';
      if (groupBy === 'service') key = s.service?.nom ?? 'Sans service';
      if (groupBy === 'clinique') key = s.service?.floor?.clinique?.nom ?? 'Sans clinique';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [sortedSensors, groupBy]);

  const totalPages = Math.max(1, Math.ceil(sortedSensors.length / pageSize));
  const sensorsPage = useMemo(() => {
    if (groupBy !== 'none') return sortedSensors; // no pagination when grouped
    const start = (currentPage - 1) * pageSize;
    return sortedSensors.slice(start, start + pageSize);
  }, [sortedSensors, currentPage, pageSize, groupBy]);

  /* ---------- Load initial data ---------- */
  // Sync sensors and cliniques from React Query
  useEffect(() => {
    if (sensorsData) {
      setSensors(sensorsData as any);
    }
  }, [sensorsData]);

  useEffect(() => {
    if (cliniquesData) {
      setLocalCliniques(cliniquesData as any);
    }
  }, [cliniquesData]);

  // Sync loading state from React Query
  useEffect(() => {
    setIsLoading(sensorsLoading);
  }, [sensorsLoading]);

  useEffect(() => {
    loadFamilles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAddOpen) {
      loadFamilles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddOpen]);

  const loadSensors = async () => {
    await refetchSensors();
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
      setGlobalError((prev) => prev ?? 'Erreur lors du chargement des familles.');
    }
  };

  const loadCliniques = async () => {
    await refetchCliniques();
  };

  const loadFloorsForClinique = async (cliniqueId: number | string) => {
    if (!cliniqueId) {
      setFloors([]);
      setServicesOptions([]);
      return;
    }

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

  const refreshAll = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      // clear local caches so select lists will be rebuilt
      setFamilles([]);
      setLocalCliniques([]);
      setFloors([]);
      setServicesOptions([]);

      const [sResp, fResp, cResp] = await Promise.all([getSensors(), getFamilies(), getCliniques()]);
      setSensors(normalizeAxiosData(sResp));
      setFamilles(normalizeAxiosData(fResp));
      setLocalCliniques(normalizeAxiosData(cResp));
    } catch (err) {
      console.error('refreshAll error', err);
      setGlobalError('Erreur lors du rafraîchissement.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSubmit = async () => {
    setFormError(null);
    setErrors({});
    if (!validateClient() || isSaving) return;

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

    setIsSaving(true);
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
        setIsSaving(false);
        return;
      }
      setFormError('Erreur lors de la sauvegarde. Voir console.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSensor = async (id: number) => {
    try {
      await deleteSensor(id);
      setSensors(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Erreur suppression', err);
      setGlobalError('Erreur lors de la suppression du capteur.');
    }
  };

  const handleEdit = (sensor: Sensor) => {
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
      unite: sensor.unite ?? '',
      famille_id: sensor.famille?.id ?? '',
      clinique_id: (cliniqueIdFromSensor as number) ?? '',
      floor_id: sensor.service?.floor?.id ?? '',
      service_id: sensor.service?.id ?? '',
      date_installation: sensor.date_installation ?? null
    });

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
      unite: '',
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

  const getStatusIcon = (sensor: Sensor) => {
    if (sensor.status === 'online') return <Wifi className="w-4 h-4 text-green-500" />;
    return <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const clinicsToRender = localCliniques;

  function timeAgo(dateString: string) {
    if (!dateString) return '';

    const date = new Date(dateString.replace(' ', 'T'));
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `il y a ${seconds} seconde${seconds > 1 ? 's' : ''}`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;

    const days = Math.floor(hours / 24);
    return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  }

  return (
    <PageLayout
      title="Gestion des Capteurs"
      description="Gérez vos capteurs IoT et leurs mesures"
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshAll()}
            title="Rafraîchir"
            aria-label="Rafraîchir les capteurs"
            disabled={isLoading || isSaving}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <TypesManagementDialog onSaved={() => loadFamilles()} />
          <FamillesManagementDialog onSaved={() => loadFamilles()} />

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsAddOpen(true); }} disabled={isLoading || isSaving}>
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
                {/* form fields... (unchanged) */}
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

                <div className="space-y-1 col-span-2">
                  <Label htmlFor="unite">Unité de mesure</Label>
                  <UnitSelector
                    value={formData.unite}
                    onChange={(value) => setFormData({ ...formData, unite: value })}
                    placeholder="Sélectionner une unité (ex: °C, %, bar...)"
                  />
                  {errors.unite && <p className="text-xs text-red-600 mt-1">{errors.unite[0]}</p>}
                </div>
              </div>

              {formError && <div className="mt-3 text-sm text-red-600">{formError}</div>}

              <div className="flex justify-end mt-4 space-x-2">
                <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }} disabled={isSaving}>Annuler</Button>
                <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Enregistrement...' : (editingSensor ? 'Modifier' : 'Ajouter')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
          {globalError}
        </div>
      )}

      {/* Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <Input
            placeholder="🔍 Rechercher par matricule, famille, service, clinique..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="h-11 text-base"
          />
        </CardContent>
      </Card>

      {/* Filters with new FilterBar component */}
      <FilterBar
        sections={[
          {
            label: "Filtres",
            content: (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">Statut</Label>
                  <CustomSelect value={filterStatus} onValueChange={(v: any) => { setFilterStatus(v); setCurrentPage(1); }} className="w-full">
                    <CustomSelectItem value="all">Tous statuts</CustomSelectItem>
                    <CustomSelectItem value="online">En ligne</CustomSelectItem>
                    <CustomSelectItem value="offline">Hors ligne</CustomSelectItem>
                  </CustomSelect>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">Famille</Label>
                  <CustomSelect value={filterFamily} onValueChange={(v: any) => { setFilterFamily(v); setCurrentPage(1); }} className="w-full">
                    {familyOptions.map(f => (
                      <CustomSelectItem key={f} value={f}>{f === 'all' ? 'Toutes familles' : f}</CustomSelectItem>
                    ))}
                  </CustomSelect>
                </div>
              </div>
            ),
          },
          {
            label: "Tri",
            content: (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">Trier par</Label>
                  <CustomSelect value={sortKey} onValueChange={(v: any) => setSortKey(v)} className="w-full">
                    <CustomSelectItem value="matricule">Matricule</CustomSelectItem>
                    <CustomSelectItem value="famille">Famille</CustomSelectItem>
                    <CustomSelectItem value="service">Service</CustomSelectItem>
                    <CustomSelectItem value="status">Status</CustomSelectItem>
                    <CustomSelectItem value="derniere_mesure">Dernière mesure</CustomSelectItem>
                  </CustomSelect>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">Ordre</Label>
                  <CustomSelect value={sortDir} onValueChange={(v: any) => setSortDir(v)} className="w-full">
                    <CustomSelectItem value="asc">↑ Croissant</CustomSelectItem>
                    <CustomSelectItem value="desc">↓ Décroissant</CustomSelectItem>
                  </CustomSelect>
                </div>
              </div>
            ),
          },
          {
            label: "Affichage",
            content: (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5">Groupement</Label>
                  <CustomSelect value={groupBy} onValueChange={(v: any) => setGroupBy(v)} className="w-full">
                    <CustomSelectItem value="none">Sans groupe</CustomSelectItem>
                    <CustomSelectItem value="famille">Par Famille</CustomSelectItem>
                    <CustomSelectItem value="service">Par Service</CustomSelectItem>
                    <CustomSelectItem value="clinique">Par Clinique</CustomSelectItem>
                  </CustomSelect>
                </div>
              </div>
            ),
          },
        ]}
        stats={
          <span>
            <strong className="text-slate-900">{filteredSensors.length}</strong> capteur{filteredSensors.length !== 1 ? 's' : ''} trouvé{filteredSensors.length !== 1 ? 's' : ''}
            {filteredSensors.length !== sensors.length && (
              <span className="text-slate-500"> sur {sensors.length} total</span>
            )}
          </span>
        }
        onReset={
          (searchTerm || filterStatus !== 'all' || filterFamily !== 'all')
            ? () => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterFamily('all');
                setCurrentPage(1);
              }
            : undefined
        }
      />

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
                <TableHead className="font-medium">Dernière Mesure</TableHead>
                <TableHead className="font-medium w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupBy !== 'none' ? (
                // Grouped rendering
                Object.entries(groupedSensors).map(([groupName, groupSensors]) => (
                  <>
                    <TableRow key={`group-${groupName}`} className="bg-gray-100 hover:bg-gray-100">
                      <TableCell colSpan={8} className="font-semibold text-sm">
                        {groupName} ({groupSensors.length})
                      </TableCell>
                    </TableRow>
                    {groupSensors.map(sensor => (
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

                        <TableCell className="text-xs">
                          {sensor.derniere_mesure ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {sensor.derniere_mesure.valeur}
                                <UnitDisplay value={sensor.unite} className="ml-1" />
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {timeAgo(sensor.derniere_mesure.date_mesure)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>

                        <TableCell className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(sensor)} disabled={isLoading || isSaving}>
                            <Edit className="w-3 h-3" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" disabled={isLoading || isSaving}><Trash2 className="w-3 h-3" /></Button>
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
                  </>
                ))
              ) : (
                // Paginated rendering
                sensorsPage.map(sensor => (
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

                    <TableCell className="text-xs">
                      {sensor.derniere_mesure ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {sensor.derniere_mesure.valeur}
                            <UnitDisplay value={sensor.unite} className="ml-1" />
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {timeAgo(sensor.derniere_mesure.date_mesure)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>

                    <TableCell className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(sensor)} disabled={isLoading || isSaving}>
                        <Edit className="w-3 h-3" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" disabled={isLoading || isSaving}><Trash2 className="w-3 h-3" /></Button>
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
                ))
              )}
            </TableBody>
          </Table>

          {groupBy === 'none' && totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedSensors.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setPageSize}
              itemLabel="capteurs"
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}

export default SensorManagement;

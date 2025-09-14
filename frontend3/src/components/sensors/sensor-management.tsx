import { useEffect, useState } from 'react';
import { getSensors, createSensor, updateSensor, deleteSensor } from './sensor-api';
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog';
import { Plus, Edit, Trash2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import type { AxiosError } from 'axios';

export interface Clinique {
  id: number;
  nom: string;
  adresse: string;
}

export interface Floor {
  id: number;
  nom: string;
  clinique: Clinique;
}

export interface Service {
  id: number;
  nom: string;
  floor: Floor;
}

export interface Famille {
  id: number;
  famille: string;
  type: { id: number; type: string };
}

export interface Mesure {
  id: number;
  valeur: number;
  date_mesure: string;
}

export interface Alerte {
  id: number;
  type: string;
  valeur: number;
  date: string;
  statut: string;
}

export interface Sensor {
  id: number;
  matricule: string;
  date_installation: string | null;
  date_derniere_connexion: string | null;
  date_derniere_deconnexion: string | null;
  seuil_min: number | null;
  seuil_max: number | null;
  adresse_ip: string | null;
  adresse_mac: string | null;
  famille: Famille;
  service: Service;
  mesures: Mesure[];
  alertes: Alerte[];
}

interface SensorManagementProps {
  cliniques?: { id: number; nom: string; adresse: string }[];
}

type ValidationErrors = Record<string, string[]>;

export function SensorManagement({ cliniques = [] }: SensorManagementProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [formData, setFormData] = useState<any>({
    matricule: '',
    seuil_min: 0,
    seuil_max: 100,
    adresse_ip: '',
    adresse_mac: '',
    famille_id: '',
    service_id: ''
  });

  // validation errors (server-side or custom client-side)
  const [errors, setErrors] = useState<ValidationErrors>({});
  // general form error message (non-field)
  const [formError, setFormError] = useState<string | null>(null);

  // Charger les capteurs
  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    try {
      const data = await getSensors();
      setSensors(data);
    } catch (error) {
      console.error('Erreur lors du chargement des capteurs', error);
    }
  };

  // Client-side minimal validation helper
  const validateClient = (): boolean => {
    const v: ValidationErrors = {};
    if (!formData.matricule || String(formData.matricule).trim() === '') {
      v.matricule = ['Le matricule est requis.'];
    }
    // basic IP pattern (loose) — backend will still validate strictly
    if (formData.adresse_ip && !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(formData.adresse_ip)) {
      v.adresse_ip = ['Adresse IP invalide (ex: 192.168.1.100).'];
    }
    // basic MAC pattern
    if (formData.adresse_mac && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.adresse_mac)) {
      v.adresse_mac = ['Adresse MAC invalide (ex: 00:1A:2B:3C:4D:5E).'];
    }
    // seuils: min <= max
    if (Number(formData.seuil_min) > Number(formData.seuil_max)) {
      v.seuil_min = ['Le seuil min doit être inférieur ou égal au seuil max.'];
      v.seuil_max = ['Le seuil max doit être supérieur ou égal au seuil min.'];
    }

    setErrors(v);
    return Object.keys(v).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    setErrors({});

    // run minimal client-side validation first
    if (!validateClient()) {
      return;
    }

    try {
      if (editingSensor) {
        await updateSensor(editingSensor.id, formData);
      } else {
        await createSensor(formData);
      }
      await loadSensors();
      setIsAddOpen(false);
      setEditingSensor(null);
      resetForm();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du capteur', err);
      // handle axios 422 validation errors (Laravel structure: response.data.errors)
      const axiosErr = err as AxiosError<any>;
      const resp = axiosErr.response;
      if (resp && resp.status === 422) {
        // try to extract errors in common shapes
        const validationErrors: ValidationErrors =
          resp.data?.errors ??
          // sometimes backend returns {field: ["msg"]} directly
          (typeof resp.data === 'object' ? resp.data : {});
        setErrors(validationErrors);
        // Optionally set a top-level message if available
        if (resp.data?.message) setFormError(String(resp.data.message));
        return;
      }

      // fallback generic message
      setFormError('Une erreur est survenue lors de la sauvegarde. Vérifiez la console pour plus de détails.');
    }
  };

  const handleDeleteSensor = async (id: number) => {
    try {
      await deleteSensor(id);
      setSensors(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression', error);
    }
  };

  const handleEdit = (sensor: Sensor) => {
    setFormData({
      matricule: sensor.matricule ?? '',
      seuil_min: sensor.seuil_min ?? 0,
      seuil_max: sensor.seuil_max ?? 100,
      adresse_ip: sensor.adresse_ip ?? '',
      adresse_mac: sensor.adresse_mac ?? '',
      famille_id: sensor.famille?.id ?? '',
      service_id: sensor.service?.id ?? ''
    });
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
      service_id: ''
    });
    setErrors({});
    setFormError(null);
    setEditingSensor(null);
  };

  // safe getStatusIcon: only parse dates if non-null
  const getStatusIcon = (sensor: Sensor) => {
    const lastConn = sensor.date_derniere_connexion ? new Date(sensor.date_derniere_connexion) : null;
    const lastDisconn = sensor.date_derniere_deconnexion ? new Date(sensor.date_derniere_deconnexion) : null;

    if (!lastConn || (lastDisconn && lastConn < lastDisconn)) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    if (sensor.alertes?.some(a => a.type === 'high' || a.type === 'low')) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }

    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Gestion des Capteurs</h1>
          <p className="text-muted-foreground">Gérez vos capteurs IoT et leurs mesures</p>
        </div>

        {/* Dialog trigger */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Capteur
            </Button>
          </DialogTrigger>

          {/* DialogContent: add aria-describedby pointing to DialogDescription id */}
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto" aria-describedby="capteur-form-description">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">{editingSensor ? 'Modifier Capteur' : 'Ajouter Capteur'}</DialogTitle>
              <DialogDescription id="capteur-form-description" className="text-sm text-muted-foreground">
                Remplissez les champs du formulaire pour {editingSensor ? 'modifier' : 'ajouter'} un capteur.
              </DialogDescription>
            </DialogHeader>

            {/* Formulaire */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <Label htmlFor="matricule">Matricule</Label>
                <Input
                  id="matricule"
                  value={formData.matricule}
                  onChange={e => setFormData({ ...formData, matricule: e.target.value })}
                />
                {errors.matricule && <p className="text-xs text-red-600 mt-1">{errors.matricule[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="adresse_ip">Adresse IP</Label>
                <Input
                  id="adresse_ip"
                  placeholder="192.168.1.100"
                  value={formData.adresse_ip}
                  onChange={e => setFormData({ ...formData, adresse_ip: e.target.value })}
                />
                {errors.adresse_ip && <p className="text-xs text-red-600 mt-1">{errors.adresse_ip[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="adresse_mac">Adresse MAC</Label>
                <Input
                  id="adresse_mac"
                  placeholder="00:1A:2B:3C:4D:5E"
                  value={formData.adresse_mac}
                  onChange={e => setFormData({ ...formData, adresse_mac: e.target.value })}
                />
                {errors.adresse_mac && <p className="text-xs text-red-600 mt-1">{errors.adresse_mac[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="seuil_min">Seuil min</Label>
                <Input
                  id="seuil_min"
                  type="number"
                  value={formData.seuil_min}
                  onChange={e => setFormData({ ...formData, seuil_min: Number(e.target.value) })}
                />
                {errors.seuil_min && <p className="text-xs text-red-600 mt-1">{errors.seuil_min[0]}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="seuil_max">Seuil max</Label>
                <Input
                  id="seuil_max"
                  type="number"
                  value={formData.seuil_max}
                  onChange={e => setFormData({ ...formData, seuil_max: Number(e.target.value) })}
                />
                {errors.seuil_max && <p className="text-xs text-red-600 mt-1">{errors.seuil_max[0]}</p>}
              </div>
              {/* You can add famille/service selects here and show errors similarly */}
            </div>

            {/* Global form error (non-field) */}
            {formError && <div className="mt-3 text-sm text-red-600">{formError}</div>}

            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Annuler</Button>
              <Button onClick={handleSubmit}>{editingSensor ? 'Modifier' : 'Ajouter'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tableau */}
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
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(sensor)}
                    </div>
                  </TableCell>

                  <TableCell className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(sensor)}>
                      <Edit className="w-3 h-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le capteur</AlertDialogTitle>
                          <AlertDialogDescription>
                            Confirmez la suppression du capteur "{sensor.matricule}"
                          </AlertDialogDescription>
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

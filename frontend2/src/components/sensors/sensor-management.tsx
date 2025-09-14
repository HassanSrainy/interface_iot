import { useState } from 'react'
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Badge } from "../ui/badge"
import { Plus, Edit, Trash2, Wifi, WifiOff, Building, MapPin, Network, Laptop } from "lucide-react"
import { Sensor } from "../dashboard/sensor-card"
import { CapteurWithRelations, Clinique, Service } from "../../types/domain"

interface SensorManagementProps {
  sensors: Sensor[] | CapteurWithRelations[]
  onAddSensor: (sensor: Omit<Sensor, 'id' | 'lastUpdate'>) => void
  onUpdateSensor: (id: string, sensor: Partial<Sensor>) => void
  onDeleteSensor: (id: string) => void
  cliniques?: Clinique[]
  services?: Service[]
}

interface FormData {
  name: string
  type: 'temperature' | 'humidity' | 'pressure' | 'battery'
  unit: string
  status: 'online' | 'offline'
  location: string
  seuil_min: number
  seuil_max: number
  adresse_ip: string
  adresse_mac: string
  matricule: string
  service_id: string
}

export function SensorManagement({ sensors, onAddSensor, onUpdateSensor, onDeleteSensor, cliniques = [], services = [] }: SensorManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSensor, setEditingSensor] = useState<Sensor | CapteurWithRelations | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'temperature' as const,
    unit: '°C',
    status: 'online' as const,
    location: '',
    seuil_min: 0,
    seuil_max: 100,
    adresse_ip: '192.168.1.100',
    adresse_mac: '00:1B:44:11:3A:B7',
    matricule: '',
    service_id: ''
  })

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'temperature',
      unit: '°C',
      status: 'online',
      location: '',
      seuil_min: 0,
      seuil_max: 100,
      adresse_ip: '192.168.1.100',
      adresse_mac: '00:1B:44:11:3A:B7',
      matricule: '',
      service_id: ''
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Générer une valeur par défaut basée sur le type de capteur
    const getDefaultValue = (type: string) => {
      switch (type) {
        case 'temperature': return 22
        case 'humidity': return 45
        case 'pressure': return 1013
        case 'battery': return 85
        default: return 0
      }
    }

    if (editingSensor) {
      const updateData: any = {
        name: formData.name,
        type: formData.type,
        unit: formData.unit,
        status: formData.status,
        location: formData.location
      }

      // Si c'est un capteur complet, ajouter les propriétés supplémentaires
      if ('famille' in editingSensor) {
        updateData.seuil_min = formData.seuil_min
        updateData.seuil_max = formData.seuil_max
        updateData.adresse_ip = formData.adresse_ip
        updateData.adresse_mac = formData.adresse_mac
        updateData.matricule = formData.matricule
      }

      onUpdateSensor(editingSensor.id, updateData)
      setEditingSensor(null)
    } else {
      const newSensor = {
        name: formData.name,
        type: formData.type,
        value: getDefaultValue(formData.type),
        unit: formData.unit,
        status: formData.status,
        location: formData.location
      }
      onAddSensor(newSensor)
      setIsAddDialogOpen(false)
    }
    
    resetForm()
  }

  const handleEdit = (sensor: Sensor | CapteurWithRelations) => {
    setEditingSensor(sensor)
    const isFullCapteur = 'famille' in sensor
    setFormData({
      name: sensor.name,
      type: sensor.type,
      unit: sensor.unit,
      status: sensor.status,
      location: sensor.location,
      seuil_min: isFullCapteur ? sensor.seuil_min : 0,
      seuil_max: isFullCapteur ? sensor.seuil_max : 100,
      adresse_ip: isFullCapteur ? sensor.adresse_ip : '192.168.1.100',
      adresse_mac: isFullCapteur ? sensor.adresse_mac : '00:1B:44:11:3A:B7',
      matricule: isFullCapteur ? sensor.matricule : '',
      service_id: isFullCapteur ? sensor.service_id : ''
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce capteur ?')) {
      onDeleteSensor(id)
    }
  }

  const getUnitForType = (type: string) => {
    switch (type) {
      case 'temperature':
        return '°C'
      case 'humidity':
        return '%'
      case 'pressure':
        return 'hPa'
      case 'battery':
        return '%'
      default:
        return ''
    }
  }

  const getDefaultThresholds = (type: string) => {
    switch (type) {
      case 'temperature':
        return { min: 18, max: 25 }
      case 'humidity':
        return { min: 30, max: 70 }
      case 'pressure':
        return { min: 990, max: 1030 }
      case 'battery':
        return { min: 20, max: 100 }
      default:
        return { min: 0, max: 100 }
    }
  }

  const handleTypeChange = (type: string) => {
    const unit = getUnitForType(type)
    const thresholds = getDefaultThresholds(type)
    setFormData({ 
      ...formData, 
      type: type as FormData['type'], 
      unit,
      seuil_min: thresholds.min,
      seuil_max: thresholds.max
    })
  }

  const isFullCapteurModel = sensors.length > 0 && 'famille' in sensors[0]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Gestion des Capteurs</h2>
          <p className="text-muted-foreground">Gérez vos capteurs IoT avec leurs seuils et paramètres réseau</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un capteur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau capteur</DialogTitle>
              <DialogDescription>
                Configurez votre nouveau capteur IoT avec ses paramètres de fonctionnement
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du capteur</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Capteur de température salon"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="matricule">Matricule</Label>
                  <Input
                    id="matricule"
                    value={formData.matricule}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    placeholder="TEMP_001"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de capteur</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">Température</SelectItem>
                      <SelectItem value="humidity">Humidité</SelectItem>
                      <SelectItem value="pressure">Pression</SelectItem>
                      <SelectItem value="battery">Batterie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unité</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seuil_min">Seuil minimum</Label>
                  <Input
                    id="seuil_min"
                    type="number"
                    step="0.1"
                    value={formData.seuil_min}
                    onChange={(e) => setFormData({ ...formData, seuil_min: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seuil_max">Seuil maximum</Label>
                  <Input
                    id="seuil_max"
                    type="number"
                    step="0.1"
                    value={formData.seuil_max}
                    onChange={(e) => setFormData({ ...formData, seuil_max: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adresse_ip">Adresse IP</Label>
                  <Input
                    id="adresse_ip"
                    value={formData.adresse_ip}
                    onChange={(e) => setFormData({ ...formData, adresse_ip: e.target.value })}
                    placeholder="192.168.1.100"
                    pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adresse_mac">Adresse MAC</Label>
                  <Input
                    id="adresse_mac"
                    value={formData.adresse_mac}
                    onChange={(e) => setFormData({ ...formData, adresse_mac: e.target.value })}
                    placeholder="00:1B:44:11:3A:B7"
                    pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Emplacement</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Salon, Cuisine, Chambre..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: FormData['status']) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">En ligne</SelectItem>
                    <SelectItem value="offline">Hors ligne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="submit">Ajouter le capteur</Button>
              </DialogFooter>
            </form>
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
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Seuils</TableHead>
                <TableHead>Réseau</TableHead>
                <TableHead>Emplacement</TableHead>
                {isFullCapteurModel && <TableHead>Clinique</TableHead>}
                {isFullCapteurModel && <TableHead>Matricule</TableHead>}
                <TableHead>Statut</TableHead>
                <TableHead>Dernière mise à jour</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensors.map((sensor) => {
                const isFullCapteur = 'famille' in sensor
                return (
                  <TableRow key={sensor.id}>
                    <TableCell className="font-medium">{sensor.name}</TableCell>
                    <TableCell className="capitalize">{sensor.type}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{sensor.value}{sensor.unit}</span>
                    </TableCell>
                    <TableCell>
                      {isFullCapteur ? (
                        <div className="text-xs">
                          <div className="text-orange-600">Min: {sensor.seuil_min}{sensor.unit}</div>
                          <div className="text-red-600">Max: {sensor.seuil_max}{sensor.unit}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isFullCapteur ? (
                        <div className="text-xs font-mono">
                          <div className="flex items-center">
                            <Network className="h-3 w-3 mr-1" />
                            {sensor.adresse_ip}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Laptop className="h-3 w-3 mr-1" />
                            {sensor.adresse_mac}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{sensor.location}</TableCell>
                    {isFullCapteur && (
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Building className="h-3 w-3" />
                          <span className="text-xs">{sensor.service.floor.clinique.nom}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{sensor.service.floor.nom} - {sensor.service.nom}</span>
                        </div>
                      </TableCell>
                    )}
                    {isFullCapteur && (
                      <TableCell className="text-xs font-mono">{sensor.matricule}</TableCell>
                    )}
                    <TableCell>
                      <Badge 
                        variant={sensor.status === 'online' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {sensor.status === 'online' ? (
                          <><Wifi className="h-3 w-3 mr-1" /> En ligne</>
                        ) : (
                          <><WifiOff className="h-3 w-3 mr-1" /> Hors ligne</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{sensor.lastUpdate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(sensor)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(sensor.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSensor} onOpenChange={(open) => !open && setEditingSensor(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le capteur</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres de votre capteur
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom du capteur</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-matricule">Matricule</Label>
                <Input
                  id="edit-matricule"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type de capteur</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temperature">Température</SelectItem>
                    <SelectItem value="humidity">Humidité</SelectItem>
                    <SelectItem value="pressure">Pression</SelectItem>
                    <SelectItem value="battery">Batterie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unité</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
              </div>
            </div>

            {editingSensor && 'famille' in editingSensor && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-seuil_min">Seuil minimum</Label>
                    <Input
                      id="edit-seuil_min"
                      type="number"
                      step="0.1"
                      value={formData.seuil_min}
                      onChange={(e) => setFormData({ ...formData, seuil_min: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-seuil_max">Seuil maximum</Label>
                    <Input
                      id="edit-seuil_max"
                      type="number"
                      step="0.1"
                      value={formData.seuil_max}
                      onChange={(e) => setFormData({ ...formData, seuil_max: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-adresse_ip">Adresse IP</Label>
                    <Input
                      id="edit-adresse_ip"
                      value={formData.adresse_ip}
                      onChange={(e) => setFormData({ ...formData, adresse_ip: e.target.value })}
                      pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-adresse_mac">Adresse MAC</Label>
                    <Input
                      id="edit-adresse_mac"
                      value={formData.adresse_mac}
                      onChange={(e) => setFormData({ ...formData, adresse_mac: e.target.value })}
                      pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-location">Emplacement</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Statut</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: FormData['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">En ligne</SelectItem>
                  <SelectItem value="offline">Hors ligne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingSensor(null)}>
                Annuler
              </Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
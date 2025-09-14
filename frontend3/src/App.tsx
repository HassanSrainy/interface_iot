import { useState } from 'react'
import { Navbar } from './components/layout/navbar'
import { SensorManagement } from './components/sensors/sensor-management'
import { CliniqueManagement } from './components/cliniques/clinique-management'
import { AlertesManagement } from './components/alertes/alertes-management'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'

// Types simplifiés
interface Sensor {
  id: string
  name: string
  type: string
  status: 'online' | 'offline' | 'warning'
  location: string
  clinique: string
  seuil_min: number
  seuil_max: number
  adresse_ip: string
  adresse_mac: string
}

interface Clinique {
  id: string
  nom: string
  adresse: string
}

interface Alerte {
  id: string
  capteur_id: string
  capteur_nom: string
  type: string
  message: string
  statut: 'active' | 'resolue' | 'ignoree'
  date: string
  priorite: 'high' | 'medium' | 'low'
}

export default function App() {
  // Données statiques directement dans App.tsx
  const [capteurs, setCapteurs] = useState<Sensor[]>([
    {
      id: '1',
      name: 'Capteur Température 001',
      type: 'Température',
      status: 'online',
      location: 'Accueil - Rez-de-chaussée',
      clinique: 'Clinique Saint-Antoine',
      seuil_min: 18,
      seuil_max: 25,
      adresse_ip: '192.168.1.101',
      adresse_mac: '00:1B:44:11:3A:B1'
    },
    {
      id: '2',
      name: 'Capteur Humidité 002',
      type: 'Humidité',
      status: 'warning',
      location: 'Urgences - 1er étage',
      clinique: 'Clinique Saint-Antoine',
      seuil_min: 40,
      seuil_max: 70,
      adresse_ip: '192.168.1.102',
      adresse_mac: '00:1B:44:11:3A:B2'
    },
    {
      id: '3',
      name: 'Capteur CO2 003',
      type: 'Qualité Air',
      status: 'offline',
      location: 'Consultation - 2ème étage',
      clinique: 'Clinique Saint-Antoine',
      seuil_min: 400,
      seuil_max: 1000,
      adresse_ip: '192.168.1.103',
      adresse_mac: '00:1B:44:11:3A:B3'
    },
    {
      id: '4',
      name: 'Capteur Température 004',
      type: 'Température',
      status: 'online',
      location: 'Réception - Rez-de-chaussée',
      clinique: 'Clinique Moderne',
      seuil_min: 20,
      seuil_max: 24,
      adresse_ip: '192.168.2.101',
      adresse_mac: '00:1B:44:22:4C:D1'
    },
    {
      id: '5',
      name: 'Capteur Pression 005',
      type: 'Pression',
      status: 'online',
      location: 'Laboratoire - 1er étage',
      clinique: 'Clinique Moderne',
      seuil_min: 1000,
      seuil_max: 1020,
      adresse_ip: '192.168.2.102',
      adresse_mac: '00:1B:44:22:4C:D2'
    }
  ])

  const [cliniques, setCliniques] = useState<Clinique[]>([
    {
      id: '1',
      nom: 'Clinique Saint-Antoine',
      adresse: '123 Rue de la Santé, Paris 75012'
    },
    {
      id: '2',
      nom: 'Clinique Moderne',
      adresse: '456 Avenue de la République, Lyon 69003'
    },
    {
      id: '3',
      nom: 'Centre Médical du Nord',
      adresse: '789 Boulevard du Progrès, Lille 59000'
    }
  ])

  const [alertes, setAlertes] = useState<Alerte[]>([
    {
      id: '1',
      capteur_id: '2',
      capteur_nom: 'Capteur Humidité 002',
      type: 'Seuil dépassé',
      message: 'Humidité élevée détectée (75%)',
      statut: 'active',
      date: '2024-01-15 14:30:00',
      priorite: 'high'
    },
    {
      id: '2',
      capteur_id: '3',
      capteur_nom: 'Capteur CO2 003',
      type: 'Connexion perdue',
      message: 'Capteur hors ligne depuis 2h',
      statut: 'active',
      date: '2024-01-15 12:15:00',
      priorite: 'medium'
    },
    {
      id: '3',
      capteur_id: '1',
      capteur_nom: 'Capteur Température 001',
      type: 'Maintenance',
      message: 'Maintenance programmée effectuée',
      statut: 'resolue',
      date: '2024-01-14 09:00:00',
      priorite: 'low'
    },
    {
      id: '4',
      capteur_id: '4',
      capteur_nom: 'Capteur Température 004',
      type: 'Calibrage',
      message: 'Calibrage automatique terminé',
      statut: 'ignoree',
      date: '2024-01-13 16:45:00',
      priorite: 'low'
    }
  ])

  // Handlers pour les capteurs
  const handleAddSensor = (newSensor: Omit<Sensor, 'id'>) => {
    const sensor: Sensor = {
      ...newSensor,
      id: Date.now().toString()
    }
    setCapteurs([...capteurs, sensor])
  }

  const handleUpdateSensor = (id: string, updatedSensor: Partial<Sensor>) => {
    setCapteurs(capteurs.map(capteur => 
      capteur.id === id ? { ...capteur, ...updatedSensor } : capteur
    ))
  }

  const handleDeleteSensor = (id: string) => {
    setCapteurs(capteurs.filter(capteur => capteur.id !== id))
  }

  // Handlers pour les cliniques
  const handleAddClinique = (newClinique: Omit<Clinique, 'id'>) => {
    const clinique: Clinique = {
      ...newClinique,
      id: Date.now().toString()
    }
    setCliniques([...cliniques, clinique])
  }

  const handleUpdateClinique = (id: string, updatedClinique: Partial<Clinique>) => {
    setCliniques(cliniques.map(clinique =>
      clinique.id === id ? { ...clinique, ...updatedClinique } : clinique
    ))
  }

  const handleDeleteClinique = (id: string) => {
    setCliniques(cliniques.filter(clinique => clinique.id !== id))
  }

  // Handlers pour les alertes
  const handleResolveAlert = (alerteId: string) => {
    setAlertes(alertes.map(alerte =>
      alerte.id === alerteId ? { ...alerte, statut: 'resolue' as const } : alerte
    ))
  }

  const handleIgnoreAlert = (alerteId: string) => {
    setAlertes(alertes.map(alerte =>
      alerte.id === alerteId ? { ...alerte, statut: 'ignoree' as const } : alerte
    ))
  }

  const sensorsOnline = capteurs.filter(c => c.status === 'online').length

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar 
        user={{ email: 'demo@iot-dashboard.com' }} 
        onLogout={() => {}}
        sensorsOnline={sensorsOnline}
        totalSensors={capteurs.length}
      />
      
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="sensors" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sensors">Gestion Capteurs</TabsTrigger>
            <TabsTrigger value="cliniques">Gestion Cliniques</TabsTrigger>
            <TabsTrigger value="alertes">Alertes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sensors" className="space-y-4">
            <SensorManagement
              sensors={capteurs}
              cliniques={cliniques}
              onAddSensor={handleAddSensor}
              onUpdateSensor={handleUpdateSensor}
              onDeleteSensor={handleDeleteSensor}
            />
          </TabsContent>

          <TabsContent value="cliniques" className="space-y-4">
            <CliniqueManagement
              cliniques={cliniques}
              onAddClinique={handleAddClinique}
              onUpdateClinique={handleUpdateClinique}
              onDeleteClinique={handleDeleteClinique}
            />
          </TabsContent>

          <TabsContent value="alertes" className="space-y-4">
            <AlertesManagement
              alertes={alertes}
              capteurs={capteurs}
              onResolveAlert={handleResolveAlert}
              onIgnoreAlert={handleIgnoreAlert}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
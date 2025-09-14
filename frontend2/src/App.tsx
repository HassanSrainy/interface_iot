import { useState, useEffect } from 'react'
import { Navbar } from './components/layout/navbar'
import { DashboardOverview } from './components/dashboard/dashboard-overview'
import { SensorManagement } from './components/sensors/sensor-management'
import { CliniqueManagement } from './components/cliniques/clinique-management'
import { UtilisateurManagement } from './components/utilisateurs/utilisateur-management'
import { AlertesManagement } from './components/alertes/alertes-management'
import { SensorEvolution } from './components/dashboard/sensor-evolution'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Sensor } from './components/dashboard/sensor-card'
import { CapteurWithRelations, Alerte, Utilisateur, Clinique } from './types/domain'
import { getCapteurs, getAlertes, getCliniques, getServices, getUtilisateurs } from './data/mock-data'

export default function App() {
  const [capteurs, setCapteurs] = useState<CapteurWithRelations[]>([])
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [cliniques, setCliniques] = useState<Clinique[]>([])
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null)

  // Load initial data using the rich domain model
  useEffect(() => {
    setCapteurs(getCapteurs())
    setAlertes(getAlertes())
    setUtilisateurs(getUtilisateurs())
    setCliniques(getCliniques())
  }, [])

  const handleAddSensor = (newSensor: Omit<Sensor, 'id' | 'lastUpdate'>) => {
    // For simplified compatibility, we'll add basic sensors to the rich model
    const sensor: CapteurWithRelations = {
      ...newSensor,
      id: Date.now().toString(),
      lastUpdate: 'maintenant',
      famille_id: '1', // Default to temperature family
      service_id: '1', // Default to first service
      matricule: `CUSTOM_${Date.now()}`,
      date_installation: new Date(),
      date_derniere_connexion: new Date(),
      seuil_min: 0,
      seuil_max: 100,
      adresse_ip: '192.168.1.200',
      adresse_mac: '00:1B:44:11:3A:FF',
      created_at: new Date(),
      updated_at: new Date(),
      famille: {
        id: '1',
        type_id: '1',
        famille: 'Température',
        created_at: new Date(),
        updated_at: new Date(),
        type: {
          id: '1',
          type: 'Environnemental',
          created_at: new Date(),
          updated_at: new Date()
        }
      },
      service: {
        id: '1',
        floor_id: '1',
        nom: 'Accueil',
        created_at: new Date(),
        updated_at: new Date(),
        floor: {
          id: '1',
          clinique_id: '1',
          nom: 'Rez-de-chaussée',
          created_at: new Date(),
          updated_at: new Date(),
          clinique: {
            id: '1',
            nom: 'Clinique Saint-Antoine',
            adresse: '123 Rue de la Santé, Paris 75012',
            created_at: new Date(),
            updated_at: new Date()
          }
        }
      }
    }
    setCapteurs([...capteurs, sensor])
  }

  const handleUpdateSensor = (id: string, updatedSensor: Partial<Sensor>) => {
    setCapteurs(capteurs.map(capteur => 
      capteur.id === id 
        ? { ...capteur, ...updatedSensor, lastUpdate: 'maintenant' }
        : capteur
    ))
  }

  const handleDeleteSensor = (id: string) => {
    setCapteurs(capteurs.filter(capteur => capteur.id !== id))
  }

  const handleResolveAlert = (alerteId: string) => {
    setAlertes(alertes.map(alerte =>
      alerte.id === alerteId
        ? { ...alerte, statut: 'resolue' as const }
        : alerte
    ))
  }

  const handleIgnoreAlert = (alerteId: string) => {
    setAlertes(alertes.map(alerte =>
      alerte.id === alerteId
        ? { ...alerte, statut: 'ignoree' as const }
        : alerte
    ))
  }

  const handleShowSensorEvolution = (sensorId: string) => {
    setSelectedSensorId(sensorId)
  }

  const handleAddClinique = (newClinique: Omit<Clinique, 'id' | 'created_at' | 'updated_at'>) => {
    const clinique: Clinique = {
      ...newClinique,
      id: Date.now().toString(),
      created_at: new Date(),
      updated_at: new Date()
    }
    setCliniques([...cliniques, clinique])
  }

  const handleUpdateClinique = (id: string, updatedClinique: Partial<Clinique>) => {
    setCliniques(cliniques.map(clinique =>
      clinique.id === id
        ? { ...clinique, ...updatedClinique, updated_at: new Date() }
        : clinique
    ))
  }

  const handleDeleteClinique = (id: string) => {
    setCliniques(cliniques.filter(clinique => clinique.id !== id))
  }

  const handleAddUtilisateur = (newUtilisateur: Omit<Utilisateur, 'id' | 'created_at' | 'updated_at' | 'date_creation'>) => {
    const utilisateur: Utilisateur = {
      ...newUtilisateur,
      id: Date.now().toString(),
      date_creation: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      clinique: newUtilisateur.clinique_id ? cliniques.find(c => c.id === newUtilisateur.clinique_id) : undefined
    }
    setUtilisateurs([...utilisateurs, utilisateur])
  }

  const handleUpdateUtilisateur = (id: string, updatedUtilisateur: Partial<Utilisateur>) => {
    setUtilisateurs(utilisateurs.map(utilisateur =>
      utilisateur.id === id
        ? { 
            ...utilisateur, 
            ...updatedUtilisateur, 
            updated_at: new Date(),
            clinique: updatedUtilisateur.clinique_id ? cliniques.find(c => c.id === updatedUtilisateur.clinique_id) : utilisateur.clinique
          }
        : utilisateur
    ))
  }

  const handleDeleteUtilisateur = (id: string) => {
    setUtilisateurs(utilisateurs.filter(utilisateur => utilisateur.id !== id))
  }

  const sensorsOnline = capteurs.filter(c => c.status === 'online').length

  // Si on affiche l'évolution d'un capteur spécifique
  if (selectedSensorId) {
    const selectedSensor = capteurs.find(c => c.id === selectedSensorId)
    if (selectedSensor) {
      return (
        <div className="min-h-screen bg-gray-50/50">
          <Navbar 
            user={{ email: 'demo@iot-dashboard.com' }} 
            onLogout={() => {}}
            sensorsOnline={sensorsOnline}
            totalSensors={capteurs.length}
          />
          <main className="container mx-auto px-4 py-6">
            <SensorEvolution
              capteur={selectedSensor}
              alertes={alertes}
              onClose={() => setSelectedSensorId(null)}
            />
          </main>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar 
        user={{ email: 'demo@iot-dashboard.com' }} 
        onLogout={() => {}}
        sensorsOnline={sensorsOnline}
        totalSensors={capteurs.length}
      />
      
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="sensors">Gestion Capteurs</TabsTrigger>
            <TabsTrigger value="cliniques">Gestion Cliniques</TabsTrigger>
            <TabsTrigger value="utilisateurs">Gestion Utilisateurs</TabsTrigger>
            <TabsTrigger value="alertes">Alertes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <DashboardOverview 
              sensors={capteurs} 
              alertes={alertes}
              onResolveAlert={handleResolveAlert}
              onIgnoreAlert={handleIgnoreAlert}
              onShowSensorEvolution={handleShowSensorEvolution}
            />
          </TabsContent>
          
          <TabsContent value="sensors" className="space-y-4">
            <SensorManagement
              sensors={capteurs}
              onAddSensor={handleAddSensor}
              onUpdateSensor={handleUpdateSensor}
              onDeleteSensor={handleDeleteSensor}
              cliniques={getCliniques()}
              services={getServices()}
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

          <TabsContent value="utilisateurs" className="space-y-4">
            <UtilisateurManagement
              utilisateurs={utilisateurs}
              cliniques={cliniques}
              onAddUtilisateur={handleAddUtilisateur}
              onUpdateUtilisateur={handleUpdateUtilisateur}
              onDeleteUtilisateur={handleDeleteUtilisateur}
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
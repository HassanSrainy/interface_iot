import { 
  Clinique, 
  Floor, 
  Service, 
  Type, 
  Famille, 
  CapteurWithRelations, 
  Mesure, 
  Alerte,
  Utilisateur 
} from '../types/domain'

// Données de démonstration correspondant au modèle UML

export const mockCliniques: Clinique[] = [
  {
    id: '1',
    nom: 'Clinique Saint-Antoine',
    adresse: '123 Rue de la Santé, Paris 75012',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: '2',
    nom: 'Centre Médical du Nord',
    adresse: '456 Avenue des Soins, Lille 59000',
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-10')
  }
]

export const mockFloors: Floor[] = [
  {
    id: '1',
    clinique_id: '1',
    nom: 'Rez-de-chaussée',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: '2',
    clinique_id: '1',
    nom: '1er étage',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: '3',
    clinique_id: '2',
    nom: 'Rez-de-chaussée',
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-10')
  }
]

export const mockServices: Service[] = [
  {
    id: '1',
    floor_id: '1',
    nom: 'Accueil',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: '2',
    floor_id: '1',
    nom: 'Salle d\'attente',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: '3',
    floor_id: '2',
    nom: 'Consultation A',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: '4',
    floor_id: '2',
    nom: 'Consultation B',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: '5',
    floor_id: '3',
    nom: 'Laboratoire',
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-10')
  }
]

export const mockTypes: Type[] = [
  {
    id: '1',
    type: 'Environnemental',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: '2',
    type: 'Sécurité',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: '3',
    type: 'Énergie',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
]

export const mockFamilles: Famille[] = [
  {
    id: '1',
    type_id: '1',
    famille: 'Température',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: '2',
    type_id: '1',
    famille: 'Humidité',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: '3',
    type_id: '1',
    famille: 'Pression',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: '4',
    type_id: '2',
    famille: 'Mouvement',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: '5',
    type_id: '3',
    famille: 'Batterie',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
]

export const mockCapteurs: CapteurWithRelations[] = [
  {
    id: '1',
    famille_id: '1',
    service_id: '2',
    matricule: 'TEMP_001',
    date_installation: new Date('2024-01-20'),
    date_derniere_connexion: new Date('2024-12-09T10:30:00'),
    seuil_min: 18,
    seuil_max: 26,
    adresse_ip: '192.168.1.101',
    adresse_mac: '00:1B:44:11:3A:B7',
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-12-09T10:30:00'),
    name: 'Température Salle d\'attente',
    type: 'temperature',
    value: 23.5,
    unit: '°C',
    status: 'online',
    lastUpdate: '2 min',
    location: 'Salle d\'attente',
    famille: {
      id: '1',
      type_id: '1',
      famille: 'Température',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      type: {
        id: '1',
        type: 'Environnemental',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    },
    service: {
      id: '2',
      floor_id: '1',
      nom: 'Salle d\'attente',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15'),
      floor: {
        id: '1',
        clinique_id: '1',
        nom: 'Rez-de-chaussée',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        clinique: {
          id: '1',
          nom: 'Clinique Saint-Antoine',
          adresse: '123 Rue de la Santé, Paris 75012',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        }
      }
    }
  },
  {
    id: '2',
    famille_id: '2',
    service_id: '3',
    matricule: 'HUM_002',
    date_installation: new Date('2024-01-22'),
    date_derniere_connexion: new Date('2024-12-09T10:29:00'),
    seuil_min: 30,
    seuil_max: 70,
    adresse_ip: '192.168.1.102',
    adresse_mac: '00:1B:44:11:3A:B8',
    created_at: new Date('2024-01-22'),
    updated_at: new Date('2024-12-09T10:29:00'),
    name: 'Humidité Consultation A',
    type: 'humidity',
    value: 62,
    unit: '%',
    status: 'online',
    lastUpdate: '1 min',
    location: 'Consultation A',
    famille: {
      id: '2',
      type_id: '1',
      famille: 'Humidité',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      type: {
        id: '1',
        type: 'Environnemental',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    },
    service: {
      id: '3',
      floor_id: '2',
      nom: 'Consultation A',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15'),
      floor: {
        id: '2',
        clinique_id: '1',
        nom: '1er étage',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        clinique: {
          id: '1',
          nom: 'Clinique Saint-Antoine',
          adresse: '123 Rue de la Santé, Paris 75012',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        }
      }
    }
  },
  {
    id: '3',
    famille_id: '3',
    service_id: '1',
    matricule: 'PRESS_003',
    date_installation: new Date('2024-02-01'),
    date_derniere_connexion: new Date('2024-12-09T10:15:00'),
    date_derniere_deconnexion: new Date('2024-12-09T10:15:00'),
    seuil_min: 980,
    seuil_max: 1050,
    adresse_ip: '192.168.1.103',
    adresse_mac: '00:1B:44:11:3A:B9',
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-12-09T10:15:00'),
    name: 'Pression Accueil',
    type: 'pressure',
    value: 1013,
    unit: 'hPa',
    status: 'offline',
    lastUpdate: '15 min',
    location: 'Accueil',
    famille: {
      id: '3',
      type_id: '1',
      famille: 'Pression',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      type: {
        id: '1',
        type: 'Environnemental',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    },
    service: {
      id: '1',
      floor_id: '1',
      nom: 'Accueil',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15'),
      floor: {
        id: '1',
        clinique_id: '1',
        nom: 'Rez-de-chaussée',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        clinique: {
          id: '1',
          nom: 'Clinique Saint-Antoine',
          adresse: '123 Rue de la Santé, Paris 75012',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        }
      }
    }
  },
  {
    id: '4',
    famille_id: '5',
    service_id: '4',
    matricule: 'BAT_004',
    date_installation: new Date('2024-02-05'),
    date_derniere_connexion: new Date('2024-12-09T10:25:00'),
    seuil_min: 20,
    seuil_max: 100,
    adresse_ip: '192.168.1.104',
    adresse_mac: '00:1B:44:11:3A:BA',
    created_at: new Date('2024-02-05'),
    updated_at: new Date('2024-12-09T10:25:00'),
    name: 'Batterie Consultation B',
    type: 'battery',
    value: 85,
    unit: '%',
    status: 'online',
    lastUpdate: '5 min',
    location: 'Consultation B',
    famille: {
      id: '5',
      type_id: '3',
      famille: 'Batterie',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      type: {
        id: '3',
        type: 'Énergie',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    },
    service: {
      id: '4',
      floor_id: '2',
      nom: 'Consultation B',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15'),
      floor: {
        id: '2',
        clinique_id: '1',
        nom: '1er étage',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        clinique: {
          id: '1',
          nom: 'Clinique Saint-Antoine',
          adresse: '123 Rue de la Santé, Paris 75012',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        }
      }
    }
  },
  {
    id: '5',
    famille_id: '1',
    service_id: '5',
    matricule: 'TEMP_005',
    date_installation: new Date('2024-02-15'),
    date_derniere_connexion: new Date('2024-12-09T10:27:00'),
    seuil_min: 16,
    seuil_max: 24,
    adresse_ip: '192.168.2.101',
    adresse_mac: '00:1B:44:11:3A:BB',
    created_at: new Date('2024-02-15'),
    updated_at: new Date('2024-12-09T10:27:00'),
    name: 'Température Laboratoire',
    type: 'temperature',
    value: 21.2,
    unit: '°C',
    status: 'online',
    lastUpdate: '3 min',
    location: 'Laboratoire',
    famille: {
      id: '1',
      type_id: '1',
      famille: 'Température',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      type: {
        id: '1',
        type: 'Environnemental',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    },
    service: {
      id: '5',
      floor_id: '3',
      nom: 'Laboratoire',
      created_at: new Date('2024-02-10'),
      updated_at: new Date('2024-02-10'),
      floor: {
        id: '3',
        clinique_id: '2',
        nom: 'Rez-de-chaussée',
        created_at: new Date('2024-02-10'),
        updated_at: new Date('2024-02-10'),
        clinique: {
          id: '2',
          nom: 'Centre Médical du Nord',
          adresse: '456 Avenue des Soins, Lille 59000',
          created_at: new Date('2024-02-10'),
          updated_at: new Date('2024-02-10')
        }
      }
    }
  }
]

export const mockMesures: Mesure[] = [
  {
    id: '1',
    capteur_id: '1',
    valeur: 23.5,
    date_mesure: new Date('2024-12-09T10:30:00'),
    created_at: new Date('2024-12-09T10:30:00'),
    updated_at: new Date('2024-12-09T10:30:00')
  },
  {
    id: '2',
    capteur_id: '1',
    valeur: 23.3,
    date_mesure: new Date('2024-12-09T10:25:00'),
    created_at: new Date('2024-12-09T10:25:00'),
    updated_at: new Date('2024-12-09T10:25:00')
  },
  {
    id: '3',
    capteur_id: '2',
    valeur: 62,
    date_mesure: new Date('2024-12-09T10:29:00'),
    created_at: new Date('2024-12-09T10:29:00'),
    updated_at: new Date('2024-12-09T10:29:00')
  }
]

export const mockAlertes: Alerte[] = [
  {
    id: '1',
    capteur_id: '3',
    type: 'deconnexion',
    valeur: 0,
    date: new Date('2024-12-09T10:15:00'),
    statut: 'active',
    created_at: new Date('2024-12-09T10:15:00'),
    updated_at: new Date('2024-12-09T10:15:00')
  },
  {
    id: '2',
    capteur_id: '4',
    mesure_id: '4',
    type: 'seuil_min',
    valeur: 15,
    date: new Date('2024-12-09T09:45:00'),
    statut: 'resolue',
    created_at: new Date('2024-12-09T09:45:00'),
    updated_at: new Date('2024-12-09T10:00:00')
  }
]

// Fonction pour obtenir les données avec les relations
export function getCapteurs(): CapteurWithRelations[] {
  return mockCapteurs
}

export function getCliniques(): Clinique[] {
  return mockCliniques
}

export function getFloors(): Floor[] {
  return mockFloors.map(floor => ({
    ...floor,
    clinique: mockCliniques.find(c => c.id === floor.clinique_id)
  }))
}

export function getServices(): Service[] {
  const floors = getFloors()
  return mockServices.map(service => ({
    ...service,
    floor: floors.find(f => f.id === service.floor_id)
  }))
}

export const mockUtilisateurs: Utilisateur[] = [
  {
    id: '1',
    nom: 'Martin',
    prenom: 'Jean',
    email: 'jean.martin@clinique-antoine.fr',
    telephone: '+33 1 42 34 56 78',
    role: 'admin',
    clinique_id: '1',
    date_creation: new Date('2024-01-15'),
    derniere_connexion: new Date('2024-12-09T09:30:00'),
    statut: 'actif',
    permissions: ['gestion_capteurs', 'gestion_alertes', 'gestion_utilisateurs', 'gestion_cliniques'],
    adresse: '123 Rue Admin, Paris 75012',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-12-09T09:30:00')
  },
  {
    id: '2',
    nom: 'Dubois',
    prenom: 'Marie',
    email: 'marie.dubois@clinique-antoine.fr',
    telephone: '+33 1 42 34 56 79',
    role: 'gestionnaire',
    clinique_id: '1',
    date_creation: new Date('2024-01-20'),
    derniere_connexion: new Date('2024-12-09T08:45:00'),
    statut: 'actif',
    permissions: ['gestion_capteurs', 'gestion_alertes'],
    adresse: '456 Avenue Gestionnaire, Paris 75012',
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-12-09T08:45:00')
  },
  {
    id: '3',
    nom: 'Leroy',
    prenom: 'Pierre',
    email: 'pierre.leroy@centre-nord.fr',
    telephone: '+33 3 20 45 67 89',
    role: 'technicien',
    clinique_id: '2',
    date_creation: new Date('2024-02-10'),
    derniere_connexion: new Date('2024-12-08T16:30:00'),
    statut: 'actif',
    permissions: ['maintenance_capteurs', 'resolution_alertes'],
    adresse: '789 Rue Technicien, Lille 59000',
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-12-08T16:30:00')
  },
  {
    id: '4',
    nom: 'Bernard',
    prenom: 'Sophie',
    email: 'sophie.bernard@clinique-antoine.fr',
    role: 'operateur',
    clinique_id: '1',
    date_creation: new Date('2024-03-01'),
    derniere_connexion: new Date('2024-12-09T07:15:00'),
    statut: 'actif',
    permissions: ['lecture_capteurs', 'lecture_alertes'],
    created_at: new Date('2024-03-01'),
    updated_at: new Date('2024-12-09T07:15:00')
  }
]

export function getAlertes(): Alerte[] {
  return mockAlertes.map(alerte => ({
    ...alerte,
    capteur: mockCapteurs.find(c => c.id === alerte.capteur_id)
  }))
}

export function getUtilisateurs(): Utilisateur[] {
  return mockUtilisateurs.map(utilisateur => ({
    ...utilisateur,
    clinique: mockCliniques.find(c => c.id === utilisateur.clinique_id)
  }))
}
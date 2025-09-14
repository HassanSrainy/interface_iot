// Types correspondant au diagramme de classes UML

export interface Clinique {
  id: string
  nom: string
  adresse: string
  created_at: Date
  updated_at: Date
}

export interface Floor {
  id: string
  clinique_id: string
  nom: string
  created_at: Date
  updated_at: Date
  clinique?: Clinique
}

export interface Service {
  id: string
  floor_id: string
  nom: string
  created_at: Date
  updated_at: Date
  floor?: Floor
}

export interface Type {
  id: string
  type: string
  created_at: Date
  updated_at: Date
}

export interface Famille {
  id: string
  type_id: string
  famille: string
  created_at: Date
  updated_at: Date
  type?: Type
}

export interface Capteur {
  id: string
  famille_id: string
  service_id: string
  matricule: string
  date_installation: Date
  date_derniere_connexion?: Date
  date_derniere_deconnexion?: Date
  seuil_min: number
  seuil_max: number
  adresse_ip: string
  adresse_mac: string
  created_at: Date
  updated_at: Date
  famille?: Famille
  service?: Service
  // Propriétés pour l'affichage (compatibilité avec l'existant)
  name: string
  type: string
  value: number
  unit: string
  status: 'online' | 'offline' | 'warning' | 'error'
  lastUpdate: string
  location: string
}

export interface Mesure {
  id: string
  capteur_id: string
  valeur: number
  date_mesure: Date
  created_at: Date
  updated_at: Date
  capteur?: Capteur
}

export interface Alerte {
  id: string
  capteur_id: string
  mesure_id?: string
  type: 'seuil_min' | 'seuil_max' | 'deconnexion' | 'erreur'
  valeur: number
  date: Date
  statut: 'active' | 'resolue' | 'ignoree'
  created_at: Date
  updated_at: Date
  capteur?: Capteur
  mesure?: Mesure
}

// Types utilitaires pour l'interface
export interface CapteurWithRelations extends Capteur {
  famille: Famille & { type: Type }
  service: Service & { 
    floor: Floor & { 
      clinique: Clinique 
    } 
  }
  mesures_recentes?: Mesure[]
  alertes_actives?: Alerte[]
}

// Utilisateur avec tous les attributs demandés
export interface Utilisateur {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: 'admin' | 'gestionnaire' | 'technicien' | 'operateur'
  clinique_id?: string
  date_creation: Date
  derniere_connexion?: Date
  statut: 'actif' | 'inactif' | 'suspendu'
  permissions: string[]
  adresse?: string
  created_at: Date
  updated_at: Date
  clinique?: Clinique
}

// Ajout de l'adresse MAC aux capteurs
export interface CapteurExtended extends Capteur {
  adresse_mac: string
}

export interface StatistiquesDashboard {
  total_capteurs: number
  capteurs_en_ligne: number
  capteurs_hors_ligne: number
  alertes_actives: number
  mesures_aujourd_hui: number
  cliniques_actives: number
}
export interface Capteur {
  id: string
  matricule: string
  seuil_min: number
  seuil_max: number
}

export interface Service {
  id: string
  nom: string
  capteurs: Capteur[]
}

export interface Floor {
  id: string
  nom: string
  services: Service[]
}

export interface Clinique {
  id: string
  nom: string
  adresse: string
  created_at: string
  updated_at: string
  floors: Floor[]
}

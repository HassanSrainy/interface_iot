import { useEffect, useState } from "react";
import api from "../api/axios";

interface Capteur {
  id: number;
  floor_id: number;
  nom: string;
}

interface Service {
  id: number;
  floor_id: number;
  nom: string;
  capteurs: Capteur[];
}

interface Floor {
  id: number;
  clinique_id: number;
  nom: string;
  services: Service[];
}

interface Clinique {
  id: number;
  nom: string;
  adresse: string;
  floors: Floor[];
}

export default function Cliniques() {
  const [cliniques, setCliniques] = useState<Clinique[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFloors, setOpenFloors] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    api.get("/cliniques")
      .then(res => setCliniques(res.data))
      .catch(err => console.error("Erreur lors du chargement des cliniques:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleFloor = (floorId: number) => {
    setOpenFloors(prev => ({ ...prev, [floorId]: !prev[floorId] }));
  };

  if (loading) {
    return <p>Chargement des cliniques...</p>;
  }

  return (
    <div>
      <h2>Liste des Cliniques</h2>
      {cliniques.length === 0 ? (
        <p>Aucune clinique trouvée.</p>
      ) : (
        <ul>
          {cliniques.map((clinique) => (
            <li key={clinique.id} style={{ marginBottom: "1.5rem" }}>
              <strong>{clinique.nom}</strong> — {clinique.adresse}
              {clinique.floors.length > 0 && (
                <ul style={{ marginTop: "0.5rem" }}>
                  {clinique.floors.map((floor) => (
                    <li key={floor.id} style={{ marginBottom: "0.5rem" }}>
                      <em 
                        style={{ cursor: "pointer", textDecoration: "underline" }} 
                        onClick={() => toggleFloor(floor.id)}
                      >
                        {floor.nom} {openFloors[floor.id] ? "▲" : "▼"}
                      </em>
                      {openFloors[floor.id] && floor.services.length > 0 && (
                        <ul style={{ marginLeft: "1rem", marginTop: "0.25rem" }}>
                          {floor.services.map((service) => (
                            <li key={service.id}>{service.nom}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

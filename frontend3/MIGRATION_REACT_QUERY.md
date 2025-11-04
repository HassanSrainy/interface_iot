# 🚀 Migration React Query - Guide Complet

## ❌ Problème actuel

Les pages de management (`sensor-management`, `alertes-management`, `clinique-management`, `utilisateur-management`) font des appels API directs avec `useState` + `useEffect`:

```tsx
// ❌ AVANT - Pas de cache, recharge à chaque navigation
const [sensors, setSensors] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    const data = await getSensors();
    setSensors(data);
    setLoading(false);
  };
  loadData();
}, []);
```

**Conséquences:**
- ❌ Données rechargées à chaque changement de page
- ❌ Chargement lent et visible
- ❌ Pas de cache
- ❌ État de chargement/erreur à gérer manuellement

## ✅ Solution - React Query

React Query gère automatiquement:
- ✅ **Cache intelligent** - Données gardées en mémoire 5-10 minutes
- ✅ **Chargement instantané** - Affiche les données du cache immédiatement
- ✅ **Mise à jour en arrière-plan** - Rafraîchit discrètement si nécessaire
- ✅ **États automatiques** - `isLoading`, `error`, `data` gérés automatiquement

```tsx
// ✅ APRÈS - Avec cache automatique
import { useSensors } from '../../queries/sensors';

const { data: sensors = [], isLoading, error } = useSensors();

// C'est tout ! Les données sont en cache et réutilisées
```

## 📦 Hooks disponibles

### Sensors
```tsx
import { useSensors, useCreateSensor, useUpdateSensor, useDeleteSensor } from '../queries/sensors';

// Lecture
const { data: sensors, isLoading } = useSensors();

// Création
const createMutation = useCreateSensor();
await createMutation.mutateAsync(newSensorData);

// Modification
const updateMutation = useUpdateSensor();
await updateMutation.mutateAsync({ id: sensorId, data: updatedData });

// Suppression
const deleteMutation = useDeleteSensor();
await deleteMutation.mutateAsync(sensorId);
```

### Alertes
```tsx
import { useAlertes } from '../queries/alertes';

const { data: alertes = [], isLoading } = useAlertes();
```

### Cliniques
```tsx
import { useCliniques } from '../queries/cliniques';

const { data: cliniques = [], isLoading } = useCliniques();
```

### Utilisateurs
```tsx
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../queries/utilisateurs';

const { data: users = [], isLoading } = useUsers();
const createMutation = useCreateUser();
const updateMutation = useUpdateUser();
const deleteMutation = useDeleteUser();
```

### Familles, Floors, Services
```tsx
import { useFamilies } from '../queries/familles';
import { useFloors, useFloorsByClinique } from '../queries/floors';
import { useServices, useServicesByFloor } from '../queries/services';

const { data: families = [] } = useFamilies();
const { data: floors = [] } = useFloorsByClinique(cliniqueId);
const { data: services = [] } = useServicesByFloor(floorId);
```

## 🔄 Exemple de migration - Sensor Management

### Avant (sensor-management.tsx)
```tsx
const [sensors, setSensors] = useState<Sensor[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [families, setFamilies] = useState([]);
const [localCliniques, setLocalCliniques] = useState([]);

useEffect(() => {
  loadSensors();
  loadFamilles();
  loadCliniques();
}, []);

const loadSensors = async () => {
  setIsLoading(true);
  try {
    const data = await getSensors();
    setSensors(data);
  } catch (err) {
    // ...
  } finally {
    setIsLoading(false);
  }
};

const handleSubmit = async () => {
  if (editingSensor) {
    await updateSensor(editingSensor.id, formData);
  } else {
    await createSensor(formData);
  }
  await loadSensors(); // Recharge manuellement
};
```

### Après (avec React Query)
```tsx
import { useSensors, useCreateSensor, useUpdateSensor, useDeleteSensor } from '../../queries/sensors';
import { useFamilies } from '../../queries/familles';
import { useCliniques } from '../../queries/cliniques';

// Remplace tous les useEffect et useState !
const { data: sensors = [], isLoading: loadingSensors } = useSensors();
const { data: families = [] } = useFamilies();
const { data: cliniques = [] } = useCliniques();

const createMutation = useCreateSensor();
const updateMutation = useUpdateSensor();
const deleteMutation = useDeleteSensor();

const handleSubmit = async () => {
  try {
    if (editingSensor) {
      await updateMutation.mutateAsync({ id: editingSensor.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    // Pas besoin de recharger ! React Query invalide automatiquement le cache
    setIsAddOpen(false);
  } catch (err) {
    // ...
  }
};

const handleDelete = async (id: number) => {
  await deleteMutation.mutateAsync(id);
  // Le cache est automatiquement mis à jour !
};
```

## ⚡ Avantages immédiats

### 1. Chargement instantané
```tsx
// L'utilisateur change de page puis revient
// ✅ Affichage instantané depuis le cache (0ms)
// ✅ Mise à jour discrète en arrière-plan si nécessaire
```

### 2. Moins de code
```tsx
// Avant: ~50 lignes
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
useEffect(() => { /* ... */ }, []);
const loadData = async () => { /* ... */ };

// Après: 1 ligne
const { data = [], isLoading, error } = useSensors();
```

### 3. Synchronisation automatique
```tsx
// Si vous créez un capteur dans sensor-management
await createMutation.mutateAsync(newSensor);

// ✅ Le dashboard est automatiquement mis à jour
// ✅ Toutes les pages qui utilisent useSensors() voient le nouveau capteur
```

## 🎯 Temps de cache configurés

| Entité | staleTime | gcTime | Raison |
|--------|-----------|--------|--------|
| **Sensors** | 5 min | 10 min | Changent peu fréquemment |
| **Alertes** | 2 min | 5 min | Plus dynamiques |
| **Cliniques** | 5 min | 10 min | Structure stable |
| **Users** | 5 min | 10 min | Changent rarement |
| **Families/Types** | 5 min | 10 min | Très stables |
| **Floors/Services** | 5 min | 10 min | Structure stable |

## 🔄 Invalidation du cache

Après une mutation (create/update/delete), React Query invalide automatiquement:

```tsx
const createMutation = useCreateSensor();

return useMutation({
  mutationFn: createSensor,
  onSuccess: () => {
    // ✅ Force le rechargement de TOUS les composants qui utilisent useSensors()
    queryClient.invalidateQueries({ queryKey: ['sensors'] });
  },
});
```

## 📝 TODO - Pages à migrer

### 1. sensor-management.tsx (Priorité haute)
- [ ] Remplacer `useState([sensors])` par `useSensors()`
- [ ] Remplacer `loadFamilles()` par `useFamilies()`
- [ ] Remplacer `loadCliniques()` par `useCliniques()`
- [ ] Utiliser `useFloorsByClinique(cliniqueId)` au lieu de `loadFloorsForClinique()`
- [ ] Utiliser `useServicesByFloor(floorId)` au lieu de `loadServicesForFloor()`
- [ ] Remplacer les fonctions CRUD par les mutations

### 2. alertes-management.tsx (Priorité haute)
- [ ] Remplacer `useState([alertes])` + `useEffect` par `useAlertes()`
- [ ] Supprimer `fetchData()` et `refresh()`
- [ ] États `loading` et `error` gérés automatiquement

### 3. utilisateur-management.tsx (Priorité moyenne)
- [ ] Remplacer `loadUsers()` par `useUsers()`
- [ ] Remplacer `loadCliniques()` par `useCliniques()`
- [ ] Utiliser mutations pour CRUD

### 4. clinique-management.tsx (Priorité basse)
- [ ] Déjà bien structuré, juste remplacer les appels directs

## 🚀 Résultat attendu

Après migration:
- ✅ **Navigation 10x plus rapide** - Données en cache
- ✅ **0 chargement visible** - Affichage instantané du cache
- ✅ **Moins de bugs** - État géré automatiquement
- ✅ **Moins de code** - ~50% de réduction
- ✅ **Meilleure UX** - Pas de spinner à chaque navigation

## 📚 Documentation

- React Query: https://tanstack.com/query/latest
- Configuration: `src/main.tsx` - `QueryClient` avec temps de cache augmentés
- Hooks: `src/queries/*.ts` - Tous les hooks disponibles

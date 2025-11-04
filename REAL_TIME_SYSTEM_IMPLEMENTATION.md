# Implémentation du Système en Temps Réel

## Vue d'ensemble
Transformation du système de monitoring IoT pour fonctionner en temps réel avec des rafraîchissements automatiques et fréquents des données critiques.

## Modifications React Query

### 1. Alertes (Critiques - 15 secondes)
**Fichier:** `frontend3/src/queries/alertes.ts`

```typescript
// useAlertes()
staleTime: 10 * 1000,           // 10 secondes
refetchInterval: 15 * 1000,     // Rafraîchit toutes les 15 secondes
refetchOnWindowFocus: true,     // Rafraîchit au retour sur l'onglet
refetchOnReconnect: true,       // Rafraîchit à la reconnexion

// useAlertesCounts()
staleTime: 10 * 1000,           // 10 secondes
refetchInterval: 15 * 1000,     // Badge temps réel
```

**Impact:** 
- Badge de notifications mis à jour en temps réel
- Alertes actives visibles immédiatement
- Notifications critiques jamais manquées

### 2. Capteurs (Critiques - 15 secondes)
**Fichier:** `frontend3/src/queries/sensors.ts`

```typescript
// useSensors()
staleTime: 10 * 1000,           // 10 secondes
refetchInterval: 15 * 1000,     // Statut en ligne/hors ligne temps réel
refetchOnWindowFocus: true,
refetchOnReconnect: true,

// useSensorsAlertCounts()
staleTime: 10 * 1000,           // 10 secondes
refetchInterval: 15 * 1000,

// useSensorMesures()
staleTime: 10 * 1000,           // 10 secondes
refetchInterval: 20 * 1000,     // Mesures rafraîchies toutes les 20 secondes
```

**Impact:**
- Statut des capteurs (online/offline) mis à jour en temps réel
- Graphiques de mesures rafraîchis automatiquement
- Dernières valeurs toujours à jour

### 3. Cliniques (Important - 30 secondes)
**Fichier:** `frontend3/src/queries/cliniques.ts`

```typescript
// useCliniques()
staleTime: 30 * 1000,           // 30 secondes
refetchInterval: 30 * 1000,     // Statistiques cliniques temps réel
refetchOnWindowFocus: true,
refetchOnReconnect: true,
```

**Impact:**
- KPIs du dashboard actualisés automatiquement
- Statistiques par clinique en temps réel
- Nombre de capteurs en ligne/alertes actives à jour

### 4. Floors & Services (Moins critique - 2 minutes)
**Fichiers:** `frontend3/src/queries/floors.ts`, `frontend3/src/queries/services.ts`

```typescript
staleTime: 2 * 60 * 1000,       // 2 minutes
gcTime: 10 * 60 * 1000,         // 10 minutes en cache
```

**Impact:**
- Structure hiérarchique rafraîchie régulièrement
- Moins de charge serveur (données moins volatiles)

### 5. Utilisateurs (Moins critique - 2 minutes)
**Fichier:** `frontend3/src/queries/utilisateurs.ts`

```typescript
// useUsers()
staleTime: 2 * 60 * 1000,       // 2 minutes
gcTime: 10 * 60 * 1000,
refetchOnWindowFocus: true,
```

### 6. Familles/Types (Statiques - 5 minutes)
**Fichier:** `frontend3/src/queries/familles.ts`

```typescript
// useFamilies()
staleTime: 5 * 60 * 1000,       // 5 minutes (données rarement modifiées)
gcTime: 10 * 60 * 1000,
```

## Composants Modifiés

### AlertsPanelUser
**Fichier:** `frontend3/src/components/dashboard/alerts-panel-user.tsx`

**Avant:**
```typescript
// setInterval manuel
const fetchAlertes = async () => { ... }
useEffect(() => {
  const t = setInterval(fetchAlertes, 10000);
  return () => clearInterval(t);
}, []);
```

**Après:**
```typescript
// React Query automatique
const { data: alertes = [], isLoading, refetch } = useAlertes();
// Rafraîchissement automatique toutes les 15 secondes
```

**Avantages:**
- Pas de doublons de requêtes
- Cache intelligent partagé
- Gestion automatique des erreurs
- Déduplication des appels API

## Stratégie de Rafraîchissement

### Priorités

#### 🔴 Critique (10-15 secondes)
- **Alertes:** Sécurité et réactivité maximale
- **Capteurs:** Détection rapide des pannes
- **Mesures:** Suivi en temps quasi-réel

#### 🟡 Important (30 secondes)
- **Cliniques:** Vue d'ensemble du système
- **Statistiques:** KPIs dashboard

#### 🟢 Standard (2 minutes)
- **Structure:** Floors, Services, Users
- **Configuration:** Changements peu fréquents

#### ⚪ Statique (5+ minutes)
- **Référentiels:** Familles, Types
- **Métadonnées:** Changent rarement

## Optimisations Réseau

### Stratégies React Query

1. **staleTime:** Durée pendant laquelle les données sont considérées fraîches
   - Réduit les requêtes inutiles
   - Données immédiatement disponibles si fraîches

2. **gcTime (anciennement cacheTime):** Durée de conservation en cache
   - Données disponibles même après démontage du composant
   - Réutilisation entre navigations

3. **refetchInterval:** Polling automatique
   - Mise à jour périodique en arrière-plan
   - Pas besoin de setInterval manuels

4. **refetchOnWindowFocus:** Rafraîchir au retour
   - Données toujours actuelles quand l'utilisateur revient
   - Meilleure UX

5. **refetchOnReconnect:** Rafraîchir après reconnexion
   - Synchronisation après perte de connexion
   - Résilience réseau

### Avantages du Système

✅ **Performance:**
- Déduplication automatique des requêtes
- Cache intelligent partagé entre composants
- Pas de requêtes en double

✅ **Expérience Utilisateur:**
- Données toujours à jour
- Indicateurs visuels de chargement
- Transitions fluides

✅ **Fiabilité:**
- Gestion automatique des erreurs
- Retry automatique
- Récupération après déconnexion

✅ **Maintenance:**
- Code plus simple (pas de setInterval manuels)
- Logique centralisée dans les hooks
- Facile à ajuster les intervalles

## Configuration par Cas d'Usage

### Dashboard Admin
- Alertes: 15s
- Capteurs: 15s  
- Cliniques: 30s
- **Total:** ~15 requêtes/minute au pic

### Dashboard Utilisateur
- Alertes (filtrées): 15s
- Capteurs (filtrés): 15s
- Cliniques (filtrées): 30s
- **Total:** ~15 requêtes/minute au pic

### Page de Gestion
- Données principales: 15-30s (selon la page)
- Référentiels: 2-5 minutes
- **Total:** ~6-8 requêtes/minute

## Métriques de Performance

### Avant (Système manuel)
- ❌ setInterval non synchronisés
- ❌ Requêtes dupliquées
- ❌ Pas de cache entre composants
- ❌ Refresh uniquement manuel ou par page

### Après (React Query optimisé)
- ✅ Polling centralisé et intelligent
- ✅ Cache partagé entre composants
- ✅ Déduplication automatique
- ✅ Refresh automatique + manuel disponible

### Charge Serveur Estimée

**Par utilisateur actif:**
- Données critiques (alertes/capteurs): 4 requêtes/minute
- Données importantes (cliniques): 2 requêtes/minute  
- Données standard: ~1 requête/2 minutes
- **Total moyen:** ~6-8 requêtes/minute/utilisateur

**Pour 10 utilisateurs simultanés:**
- ~60-80 requêtes/minute
- Largement gérable avec Laravel + caching

## Optimisations Backend Recommandées

### Cache Laravel (Optionnel mais recommandé)

```php
// Dans les contrôleurs
public function index()
{
    return Cache::remember('capteurs.all', 10, function() {
        return Capteur::with('alertes', 'mesures')->get();
    });
}

public function capteursByCliniqueUser($userId) 
{
    return Cache::remember("capteurs.user.{$userId}", 10, function() use ($userId) {
        // ... logique existante
    });
}
```

**Avantages:**
- Réduit la charge DB
- Temps de réponse plus rapide
- Cache de 10 secondes aligné avec staleTime frontend

### Indexes Base de Données

Vérifier que ces index existent:
```sql
-- Performance alertes
CREATE INDEX idx_alertes_statut ON alertes(statut);
CREATE INDEX idx_alertes_capteur_date ON alertes(capteur_id, date);

-- Performance capteurs
CREATE INDEX idx_capteurs_status ON capteurs(status);
CREATE INDEX idx_capteurs_service ON capteurs(service_id);

-- Performance pivot
CREATE INDEX idx_clinique_user ON clinique_user(user_id, clinique_id);
```

## WebSocket (Future Enhancement)

Pour un système vraiment temps réel, considérer:

### Laravel Broadcasting + Pusher/Socket.io

```php
// Événement temps réel
event(new AlerteCreated($alerte));
```

```typescript
// Frontend écoute
Echo.channel('alertes')
  .listen('AlerteCreated', (e) => {
    queryClient.invalidateQueries(['alertes']);
  });
```

**Avantages:**
- Push serveur → client instantané
- Pas de polling
- Réduction drastique des requêtes

**Inconvénients:**
- Complexité accrue
- Infrastructure supplémentaire
- Coût (services tiers)

## Testing

### Tests Recommandés

1. **Load Testing:**
   ```bash
   # Simuler 50 utilisateurs simultanés
   ab -n 1000 -c 50 http://localhost:8000/api/capteurs
   ```

2. **Monitoring React Query:**
   ```typescript
   // Activer React Query Devtools
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
   
   <ReactQueryDevtools initialIsOpen={false} />
   ```

3. **Network Analysis:**
   - Ouvrir Chrome DevTools → Network
   - Observer la fréquence des requêtes
   - Vérifier les temps de réponse

## Résumé des Intervalles

| Donnée | Interval | Raison |
|--------|----------|--------|
| Alertes | 15s | Critique - Sécurité |
| Capteurs Status | 15s | Critique - Monitoring |
| Mesures | 20s | Important - Suivi |
| Cliniques | 30s | Important - Vue globale |
| Floors/Services | 2min | Standard - Structure |
| Utilisateurs | 2min | Standard - Gestion |
| Familles/Types | 5min | Statique - Référentiels |

## Build Status

✅ **Build réussi:** 1072.35 kB (gzipped 304.86 kB)
✅ **Aucune erreur TypeScript**
✅ **Tous les composants compilent**

## Prochaines Étapes

1. ✅ Intervalles de rafraîchissement optimisés
2. ✅ Composants migré vers React Query
3. ⏳ Tests de charge serveur
4. ⏳ Monitoring des performances en production
5. ⏳ Considérer WebSocket si nécessaire
6. ⏳ Optimisation cache Laravel
7. ⏳ Ajout indexes base de données

## Notes Importantes

- Les intervalles peuvent être ajustés selon la charge serveur
- Monitoring en production recommandé pour tuning
- Cache backend fortement recommandé
- WebSocket optionnel mais améliorerait encore l'UX

# Espace Utilisateur Complet - Documentation

## 🎯 Vue d'ensemble

L'espace utilisateur a été entièrement implémenté avec une architecture similaire à l'espace administrateur, mais avec des données filtrées selon les cliniques attribuées à chaque utilisateur.

## 📁 Structure des Pages Utilisateur

### Routes Disponibles

```
/user/dashboard  → Tableau de bord utilisateur avec statistiques personnalisées
/user/capteurs   → Gestion des capteurs des cliniques attribuées
/user/cliniques  → Visualisation des cliniques attribuées
/user/alertes    → Gestion des alertes des capteurs attribués
```

### Fichiers Créés

```
frontend3/src/
├── pages/user/
│   ├── UserDashboardPage.tsx   → Page dashboard utilisateur
│   ├── UserCapteursPage.tsx    → Page capteurs utilisateur
│   ├── UserCliniquesPage.tsx   → Page cliniques utilisateur
│   └── UserAlertesPage.tsx     → Page alertes utilisateur
├── hooks/
│   └── useUserNavbarStats.ts   → Hook pour les stats navbar (réutilisable)
└── components/layout/
    └── UserNavbar.tsx          → Navbar avec navigation + notifications
```

## 🔐 Protection des Routes

Les routes utilisateur sont protégées par le composant `ProtectedRoute` avec le rôle `"user"`:

```tsx
<Route 
  path="/user/dashboard" 
  element={<ProtectedRoute element={<UserDashboardPage />} allowedRoles={["user"]} />} 
/>
```

## 🎨 Navigation Utilisateur

### UserNavbar - Fonctionnalités

1. **Logo + Titre**: Icône Wifi + "Espace Utilisateur"
2. **Menu de Navigation**: 
   - Dashboard (icône LayoutDashboard)
   - Capteurs (icône Gauge)
   - Cliniques (icône Building2)
   - Alertes (icône AlertTriangle)
3. **Badge de Statut**: `X/Y capteurs connectés`
4. **Notification d'Alertes**: 
   - Badge rouge avec compteur (99+ max)
   - Lien vers `/user/alertes`
5. **Profil Utilisateur**: Email affiché
6. **Bouton Déconnexion**

### Styling de la Navbar

- Navigation active: fond bleu clair (`bg-blue-50`) + texte bleu (`text-blue-600`)
- Navigation inactive: texte gris avec hover
- Badge d'alertes: cercle rouge 16px, texte blanc centré parfaitement

## 📊 Hook useUserNavbarStats

### Fonctionnalités

```typescript
const { sensorsCount, onlineCount, alertsCount, loading } = useUserNavbarStats(userId);
```

- **Chargement automatique** des stats au montage du composant
- **Rafraîchissement périodique** toutes les 30 secondes
- **Protection anti-double-chargement** avec `useRef`
- **Cleanup automatique** à la destruction du composant

### Données Retournées

- `sensorsCount`: Nombre total de capteurs attribués
- `onlineCount`: Nombre de capteurs connectés
- `alertsCount`: Nombre d'alertes actives
- `loading`: État de chargement

## 🔌 API Backend

### Endpoints Utilisateur Disponibles

```php
// Cliniques attribuées
GET /api/users/{userId}/cliniques

// Capteurs des cliniques attribuées
GET /api/users/{userId}/capteurs

// Alertes des capteurs attribués
GET /api/users/{userId}/alertes

// Stats navbar (optimisé)
GET /api/users/{userId}/navbar-stats

// Compteur d'alertes (batch)
GET /api/users/{userId}/capteurs/alertes/nbr

// Mesures d'un capteur
GET /api/users/{userId}/capteurs/{capteurId}/mesures

// Alertes résolues
GET /api/users/{userId}/alertes-resolved
```

### Réponse Navbar Stats

```json
{
  "sensors_count": 42,
  "online_count": 38,
  "alerts_count": 5
}
```

## 🧩 Composants Utilisateur

Les composants suivants sont déjà implémentés et utilisent les API user-scoped:

- `DashboardOverviewUser`: Tableau de bord avec stats et graphiques
- `SensorManagementUser`: Liste/gestion des capteurs attribués
- `CliniqueManagementUser`: Visualisation des cliniques attribuées
- `AlertesManagementUser`: Gestion des alertes actives/résolues

## 🔄 Flux d'Authentification

### Login

```
1. Utilisateur se connecte via /login
2. Le hook useAuth.login() authentifie et stocke le user
3. Le role est extrait (role, roles[], is_admin, role_name)
4. Redirection automatique:
   - role === "admin" → "/"
   - role === "user" → "/user/dashboard"
```

### Protection

```
1. ProtectedRoute vérifie l'authentification
2. Si allowedRoles spécifié, vérifie le role
3. Admin: accepté pour routes admin
4. User: accepté pour routes user
5. Sinon: redirection vers /login ou page "Réservé Admin"
```

## 🎯 Différences Admin vs User

| Fonctionnalité | Admin | Utilisateur |
|---------------|-------|-------------|
| **Routes** | `/` `/capteurs` `/cliniques` `/alertes` `/users` | `/user/dashboard` `/user/capteurs` `/user/cliniques` `/user/alertes` |
| **Données** | Toutes les cliniques/capteurs | Cliniques attribuées uniquement |
| **Navigation** | Navbar (logo + liens) | UserNavbar (logo + liens + stats) |
| **Gestion Users** | ✅ Oui | ❌ Non |
| **CRUD Complet** | ✅ Oui | ⚠️ Limité aux données attribuées |
| **API Endpoint** | `/api/capteurs` | `/api/users/{userId}/capteurs` |

## 🚀 Prochaines Étapes (Optionnel)

### Améliorations Possibles

1. **Mobile Menu**: Ajouter un menu hamburger responsive
2. **Notifications Push**: Alertes temps réel via WebSocket
3. **Préférences Utilisateur**: Thème, langue, notifications
4. **Export de Données**: CSV/PDF des capteurs et alertes
5. **Filtres Avancés**: Recherche multicritères
6. **Graphiques Interactifs**: Zoom, sélection de période
7. **Mode Hors-ligne**: Cache local avec sync

### Performance

1. **React Query**: Déjà implémenté pour le caching
2. **Lazy Loading**: Code splitting par route
3. **Virtualization**: Pour listes de 1000+ éléments
4. **Optimistic Updates**: UI instantanée pour les actions

## 📝 Notes Importantes

### Navbar Styling

Le badge d'alertes utilise des **styles inline** plutôt que Tailwind pour garantir un rendu parfait:

```tsx
style={{
  backgroundColor: '#dc2626',
  minWidth: '16px',
  height: '16px',
  padding: '0 2px',
  lineHeight: '1'
}}
```

Raison: Les classes Tailwind peuvent être surchargées par d'autres styles. Les styles inline garantissent la priorité CSS.

### Role Detection

Le `ProtectedRoute` utilise plusieurs heuristiques pour détecter le rôle:

1. `user.role`
2. `user.roles[0]` (string ou objet avec `name`)
3. `user.is_admin` (boolean)
4. `user.role_name`
5. Fallback localStorage
6. Dev fallback: email contient "admin" ou id === 1

### User ID

Chaque page utilisateur récupère l'ID via `useAuth()`:

```tsx
const { user } = useAuth();
const userId = user?.id;
```

Cet ID est ensuite passé à l'API pour filtrer les données.

## ✅ Checklist de Vérification

- [x] Routes utilisateur créées (`/user/dashboard`, `/user/capteurs`, etc.)
- [x] Composants user-scoped existants et fonctionnels
- [x] UserNavbar avec navigation + notifications
- [x] Hook `useUserNavbarStats` pour optimisation
- [x] Protection par rôle sur toutes les routes
- [x] Redirection automatique après login selon rôle
- [x] API backend avec endpoints user-scoped
- [x] Badge de notifications avec style parfait
- [x] Rafraîchissement périodique des stats (30s)

## 🎓 Architecture Complète

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐         ┌──────────────┐        │
│  │  Admin Space │         │  User Space  │        │
│  ├──────────────┤         ├──────────────┤        │
│  │ /            │         │ /user/dashboard│      │
│  │ /capteurs    │         │ /user/capteurs │      │
│  │ /cliniques   │         │ /user/cliniques│      │
│  │ /alertes     │         │ /user/alertes  │      │
│  │ /users       │         └──────────────┘        │
│  └──────────────┘                                  │
│         │                        │                  │
│         │                        │                  │
│         └────────────┬───────────┘                  │
│                      │                              │
│              ┌───────▼────────┐                    │
│              │  ProtectedRoute │                    │
│              └───────┬────────┘                    │
│                      │                              │
│              ┌───────▼────────┐                    │
│              │   AuthProvider  │                    │
│              └───────┬────────┘                    │
│                      │                              │
└──────────────────────┼──────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       │
                ┌──────▼──────┐
                │   Laravel    │
                │   Backend    │
                ├──────────────┤
                │ /api/capteurs│ (admin)
                │ /api/users/{id}/capteurs│ (user)
                │ /api/users/{id}/navbar-stats│
                └──────────────┘
                       │
                ┌──────▼──────┐
                │   Database   │
                │   (MySQL)    │
                └──────────────┘
```

## 🔧 Maintenance

### Mise à jour des Stats Navbar

Si besoin de changer la fréquence de rafraîchissement:

```typescript
// Dans useUserNavbarStats.ts
const interval = setInterval(() => {
  if (!mounted) return;
  fetchNavbarStats();
}, 30000); // ← Modifier ici (en millisecondes)
```

### Ajout d'une Nouvelle Page Utilisateur

1. Créer le composant dans `pages/user/UserNewPage.tsx`
2. Ajouter la route dans `routes.tsx`:
```tsx
<Route 
  path="/user/newpage" 
  element={<ProtectedRoute element={<UserNewPage />} allowedRoles={["user"]} />} 
/>
```
3. Ajouter le lien dans `UserNavbar.tsx`:
```tsx
{ path: "/user/newpage", label: "New Page", icon: IconName }
```

---

**Date de création**: ${new Date().toLocaleDateString('fr-FR')}  
**Version**: 1.0  
**Status**: ✅ Production Ready

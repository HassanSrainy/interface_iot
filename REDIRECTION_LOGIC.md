# Logique de Redirection - Documentation

## 🎯 Vue d'ensemble

Le système de redirection garantit que chaque utilisateur accède automatiquement à son espace approprié selon son rôle (admin ou user).

## 🔄 Flux de Redirection

### 1. Connexion (Login)

**Fichier**: `frontend3/src/pages/Login.tsx`

```
Utilisateur se connecte
    ↓
Authentification réussie
    ↓
Extraction du rôle (role, roles[], is_admin, role_name)
    ↓
Si "from" existe (redirection après protection) → Retour à la page demandée
Sinon :
    - role === "admin" → "/"
    - role === "user" → "/user/dashboard"
```

**Code clé**:
```tsx
if (from) {
  navigate(from, { replace: true });
} else if (role === "admin") {
  navigate("/");
} else {
  navigate("/user/dashboard");
}
```

### 2. Protection des Routes

**Fichier**: `frontend3/src/components/ProtectedRoute.tsx`

```
Utilisateur tente d'accéder à une route protégée
    ↓
Vérification de l'authentification
    ↓
Non authentifié → Redirection vers /login
    ↓
Authentifié → Vérification du rôle
    ↓
allowedRoles inclut "admin" ET utilisateur n'est pas admin
    → Redirection vers /user/dashboard
    ↓
allowedRoles inclut "user" ET utilisateur est admin
    → Accès autorisé (admin peut tout voir)
    ↓
Rôle correspond aux allowedRoles
    → Accès autorisé
    ↓
Sinon → ReservedForAdmin (qui redirige)
```

**Code clé**:
```tsx
if (allowedRoles) {
  if (role && allowedRoles.includes(role)) return element;
  
  // Utilisateur normal tente d'accéder à une route admin
  if (allowedRoles.includes('admin') && !isAdminEffective) {
    return <Navigate to="/user/dashboard" replace />;
  }
  
  // Admin peut accéder aux routes utilisateur
  if (allowedRoles.includes('user') && isAdminEffective) {
    return element;
  }
  
  return <ReservedForAdmin />;
}
```

### 3. Page Réservée Admin

**Fichier**: `frontend3/src/components/ReservedForAdmin.tsx`

```
Page affichée quand accès refusé
    ↓
useEffect se déclenche
    ↓
Utilisateur connecté → Redirection vers /user/dashboard
Utilisateur non connecté → Redirection vers /login
```

**Code clé**:
```tsx
useEffect(() => {
  if (user) {
    navigate("/user/dashboard", { replace: true });
  } else {
    navigate("/login", { replace: true });
  }
}, [user, navigate]);
```

## 🛣️ Mapping des Routes

### Routes Admin (allowedRoles: ["admin"])

| Route | Redirection si User Normal |
|-------|---------------------------|
| `/` (Dashboard) | → `/user/dashboard` |
| `/capteurs` | → `/user/dashboard` |
| `/cliniques` | → `/user/dashboard` |
| `/alertes` | → `/user/dashboard` |
| `/users` | → `/user/dashboard` |

### Routes Utilisateur (allowedRoles: ["user"])

| Route | Accès Admin | Accès User Normal |
|-------|-------------|-------------------|
| `/user` | ✅ Redirigé vers `/user/dashboard` | ✅ Redirigé vers `/user/dashboard` |
| `/user/dashboard` | ✅ Autorisé | ✅ Autorisé |
| `/user/capteurs` | ✅ Autorisé | ✅ Autorisé |
| `/user/cliniques` | ✅ Autorisé | ✅ Autorisé |
| `/user/alertes` | ✅ Autorisé | ✅ Autorisé |

### Routes Publiques

| Route | Redirection |
|-------|------------|
| `/login` | Si déjà connecté: selon rôle |
| `/debug-auth` | Protection générique |
| `/*` (404) | Page Not Found |

## 🔐 Détection du Rôle

Le `ProtectedRoute` utilise plusieurs sources pour détecter le rôle utilisateur:

1. **user.role** (string directe)
2. **user.roles[0]** (array de strings ou d'objets avec `name`)
3. **user.is_admin** (boolean)
4. **user.role_name** (string alternative)
5. **localStorage** (fallback si contexte perdu)
6. **Heuristiques dev**:
   - Email contient "admin" → admin
   - ID === 1 → admin

**Code clé**:
```tsx
const role = roleFromUser ?? 
  (Array.isArray(rolesArray) && rolesArray.length ? 
    (typeof rolesArray[0] === 'string' ? rolesArray[0] : rolesArray[0]?.name) 
    : undefined) ?? 
  roleName ?? 
  fallbackFromLocalStorage();

const isAdmin = (role === 'admin') || 
  (isAdminFlag === true) || 
  (Array.isArray(rolesArray) && rolesArray.includes('admin'));

const isAdminEffective = isAdmin || emailIsAdminLike || idIsFirst;
```

## 📊 Diagramme de Flux Complet

```
┌──────────────────────────────────────────────────────────┐
│                    Utilisateur                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Non authentifié?    │
         └───────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │ Oui                     │ Non
        ▼                         ▼
  ┌──────────┐          ┌──────────────────┐
  │  /login  │          │ Vérification rôle │
  └──────────┘          └────────┬──────────┘
        │                        │
        │ Login réussi           │
        │                        │
        ▼                        ▼
   ┌─────────────┐      ┌──────────────────┐
   │ Rôle = ?    │      │ Route demandée?  │
   └──────┬──────┘      └────────┬─────────┘
          │                      │
    ┌─────┴─────┐         ┌──────┴──────┐
    │           │         │             │
    ▼           ▼         ▼             ▼
┌────────┐  ┌──────────┐ ┌───────┐  ┌─────────┐
│ Admin  │  │   User   │ │ Admin │  │  User   │
│   →    │  │    →     │ │ Route │  │  Route  │
│   /    │  │ /user/   │ └───┬───┘  └────┬────┘
│        │  │dashboard │     │            │
└────────┘  └──────────┘     │            │
                              │            │
                    ┌─────────┴────┐       │
                    │ User normal? │       │
                    └──────┬───────┘       │
                           │               │
                     ┌─────┴─────┐         │
                     │ Oui       │ Non     │
                     ▼           ▼         ▼
              ┌──────────┐  ┌─────────┐ ┌────────┐
              │ /user/   │  │ Accès   │ │ Accès  │
              │dashboard │  │ autorisé│ │autorisé│
              └──────────┘  └─────────┘ └────────┘
```

## 🧪 Scénarios de Test

### Scénario 1: Utilisateur Normal se connecte
```
1. Accède à /login
2. Entre email/password (role = "user")
3. → Redirigé vers /user/dashboard ✅
```

### Scénario 2: Admin se connecte
```
1. Accède à /login
2. Entre email/password (role = "admin")
3. → Redirigé vers / (dashboard admin) ✅
```

### Scénario 3: User tente d'accéder à route admin
```
1. User connecté (role = "user")
2. Navigue vers /capteurs
3. ProtectedRoute détecte: allowedRoles=["admin"], role="user"
4. → Redirigé vers /user/dashboard ✅
```

### Scénario 4: Admin accède à route user
```
1. Admin connecté (role = "admin")
2. Navigue vers /user/capteurs
3. ProtectedRoute détecte: allowedRoles=["user"], isAdminEffective=true
4. → Accès autorisé ✅ (admin peut tout voir)
```

### Scénario 5: Accès direct sans auth
```
1. Non connecté
2. Navigue vers /capteurs
3. ProtectedRoute détecte: user=null
4. → Redirigé vers /login avec state.from="/capteurs"
5. Après login admin: → Retour à /capteurs ✅
```

### Scénario 6: Route /user redirige vers dashboard
```
1. User connecté
2. Navigue vers /user
3. Route définit: <Navigate to="/user/dashboard" replace />
4. → Redirigé vers /user/dashboard ✅
```

## ⚙️ Configuration Routes

**Fichier**: `frontend3/src/routes.tsx`

```tsx
// Routes Admin (protégées)
<Route 
  path="/" 
  element={<ProtectedRoute element={<DashboardOverviewPage />} allowedRoles={["admin"]} />} 
/>

// Routes User (protégées)
<Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
<Route 
  path="/user/dashboard" 
  element={<ProtectedRoute element={<UserDashboardPage />} allowedRoles={["user"]} />} 
/>

// Routes publiques
<Route path="/login" element={<LoginPage />} />
<Route path="*" element={<NotFound />} />
```

## 🔧 Points d'Extension

### Ajouter un nouveau rôle (ex: "moderator")

1. **Backend**: Ajouter le rôle dans la table `roles`
2. **Login**: Détecter le nouveau rôle
```tsx
else if (role === "moderator") {
  navigate("/moderator/dashboard");
}
```
3. **Routes**: Créer les routes avec `allowedRoles={["moderator"]}`
4. **ProtectedRoute**: La logique existante supportera automatiquement

### Rediriger vers une page spécifique après login

```tsx
// Dans Login.tsx, modifier la logique:
const redirectPath = role === "admin" 
  ? "/" 
  : role === "moderator"
  ? "/moderator/overview"
  : "/user/dashboard";
  
navigate(redirectPath);
```

## 📝 Résumé

✅ **Login redirige** vers `/user/dashboard` pour les utilisateurs normaux  
✅ **ProtectedRoute bloque** l'accès des users aux routes admin  
✅ **Admin peut accéder** aux routes user (supervision)  
✅ **ReservedForAdmin redirige** automatiquement au lieu d'afficher une erreur  
✅ **Redirection automatique** `/user` → `/user/dashboard`  
✅ **Retour après login** vers la page demandée initialement  

---

**Date**: 4 novembre 2025  
**Version**: 1.0  
**Status**: ✅ Testé et fonctionnel

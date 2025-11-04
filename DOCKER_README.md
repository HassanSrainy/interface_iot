# 🐳 Guide Docker - Clinic Monitoring System

## 📋 Prérequis

- Docker Desktop installé (Windows/Mac/Linux)
- Docker Compose (inclus avec Docker Desktop)
- Ports disponibles : 3000 (frontend), 8000 (backend), 3306 (MySQL)

## 🚀 Démarrage rapide

### 1. Construire et lancer tous les services

```bash
docker-compose up -d --build
```

### 2. Vérifier que tout fonctionne

```bash
# Voir les logs de tous les services
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 3. Accéder à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000
- **MySQL** : localhost:3306

## 📦 Services

### MySQL (Port 3306)
- Base de données : `backend-iot`
- Utilisateur : `clinic_user`
- Mot de passe : `clinic_password`
- Root password : `root_password`

### Backend Laravel (Port 8000)
- Framework : Laravel + PHP 8.2
- Migrations automatiques au démarrage
- Seeds automatiques
- API REST disponible sur http://localhost:8000/api

### Frontend React (Port 3000)
- Framework : React 18 + Vite + TypeScript
- Hot reload activé
- Connexion au backend via http://localhost:8000

## 🛠️ Commandes utiles

### Démarrer les services
```bash
docker-compose up -d
```

### Arrêter les services
```bash
docker-compose down
```

### Arrêter et supprimer les volumes (⚠️ efface la base de données)
```bash
docker-compose down -v
```

### Redémarrer un service spécifique
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql
```

### Voir les logs en temps réel
```bash
docker-compose logs -f
```

### Accéder au shell d'un container
```bash
# Backend
docker-compose exec backend bash

# Frontend
docker-compose exec frontend sh

# MySQL
docker-compose exec mysql bash
```

### Exécuter des commandes Artisan
```bash
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan db:seed
docker-compose exec backend php artisan tinker
```

### Exécuter des commandes npm
```bash
docker-compose exec frontend npm install
docker-compose exec frontend npm run build
```

## 🔧 Configuration

### Variables d'environnement Backend

Les variables sont définies dans `docker-compose.yml` mais vous pouvez aussi créer un fichier `.env` dans le dossier `backend/` :

```env
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=backend-iot
DB_USERNAME=clinic_user
DB_PASSWORD=clinic_password
```

### Variables d'environnement Frontend

Dans `frontend3/.env` :

```env
VITE_API_URL=http://localhost:8000
```

## 🐛 Dépannage

### Le backend ne démarre pas
```bash
# Vérifier les logs
docker-compose logs backend

# Reconstruire le container
docker-compose up -d --build backend
```

### MySQL n'est pas prêt
```bash
# Attendre que MySQL soit prêt (healthcheck)
docker-compose logs mysql

# Redémarrer le backend après MySQL
docker-compose restart backend
```

### Erreurs de permissions
```bash
# Donner les bonnes permissions
docker-compose exec backend chmod -R 775 storage bootstrap/cache
```

### Reset complet
```bash
# Tout supprimer et recommencer
docker-compose down -v
docker-compose up -d --build
```

## 📊 État des services

### Vérifier l'état
```bash
docker-compose ps
```

### Statistiques des containers
```bash
docker stats
```

## 🔄 Mise à jour

### Reconstruire après des changements de code
```bash
# Backend
docker-compose up -d --build backend

# Frontend
docker-compose up -d --build frontend

# Tous les services
docker-compose up -d --build
```

## 🗄️ Base de données

### Accéder à MySQL
```bash
docker-compose exec mysql mysql -u clinic_user -p
# Mot de passe : clinic_password
```

### Sauvegarder la base de données
```bash
docker-compose exec mysql mysqldump -u clinic_user -p backend-iot > backup.sql
```

### Restaurer la base de données
```bash
cat backup.sql | docker-compose exec -T mysql mysql -u clinic_user -p backend-iot
```

## 🎯 Comptes de test

Une fois l'application démarrée, vous pouvez vous connecter avec :

- **Admin** : admin@example.com / password123
- **User1** : user1@example.com / password123
- **User2** : user2@example.com / password123

## 📝 Notes

- Les volumes Docker persistent les données même après `docker-compose down`
- Utilisez `docker-compose down -v` uniquement si vous voulez tout réinitialiser
- Le hot reload fonctionne pour le frontend et le backend
- Les migrations et seeds s'exécutent automatiquement au premier lancement

## 🚨 Production

Pour la production, modifiez `docker-compose.yml` :

```yaml
backend:
  environment:
    APP_ENV: production
    APP_DEBUG: false
  command: >
    sh -c "
      composer install --no-dev --optimize-autoloader &&
      php artisan config:cache &&
      php artisan route:cache &&
      php artisan view:cache &&
      php artisan serve --host=0.0.0.0 --port=8000
    "
```

Et pour le frontend, construisez les fichiers statiques :

```yaml
frontend:
  command: npm run build
```

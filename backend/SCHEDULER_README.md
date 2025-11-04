# Scheduler Laravel - Vérification Automatique des Capteurs

Ce système vérifie automatiquement la connexion des capteurs toutes les 2 minutes et génère des alertes de déconnexion si nécessaire.

## ⚠️ IMPORTANT : Configuration Laravel 11

**Dans Laravel 11, les tâches planifiées se définissent dans `routes/console.php` (et NON plus dans `app/Console/Kernel.php`).**

La configuration se trouve dans :
```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('check:capteurs-connection')
    ->everyTwoMinutes()
    ->withoutOverlapping()
    ->runInBackground();
```

Pour vérifier que la tâche est bien enregistrée :
```bash
php artisan schedule:list
```

Vous devriez voir :
```
*/2 * * * *  php artisan check:capteurs-connection  Next Due: ...
```

## 🚀 Démarrage Rapide (Développement)

### Option 1 : Commande Simple (Recommandé)

Ouvre un terminal dans le dossier `backend` et lance :

```bash
php artisan schedule:work
```

Cette commande reste active et exécute le scheduler automatiquement.

### Option 2 : Script Batch Windows

Double-clique sur `start-scheduler.bat` dans le dossier backend.

## 🏭 Installation en Production (Windows)

### Installation Automatique

1. Ouvre PowerShell **en tant qu'Administrateur**
2. Navigue vers le dossier backend :
   ```powershell
   cd C:\Users\user\Desktop\clinic-monitoring\backend
   ```
3. Exécute le script d'installation :
   ```powershell
   .\install-scheduler-windows.ps1
   ```

Cette commande va créer une tâche planifiée Windows qui exécute le scheduler toutes les minutes automatiquement.

### Vérification de l'Installation

```powershell
Get-ScheduledTask -TaskName "Laravel_Scheduler_ClinicMonitoring"
```

### Désinstallation

```powershell
Unregister-ScheduledTask -TaskName "Laravel_Scheduler_ClinicMonitoring" -Confirm:$false
```

## 📋 Ce qui est automatisé

### Vérification des Capteurs (toutes les 2 minutes)

```
php artisan check:capteurs-connection
```

Cette commande :
- ✅ Vérifie tous les capteurs
- ✅ Détecte les capteurs déconnectés (> 5 minutes sans signal)
- ✅ Crée automatiquement des alertes de déconnexion
- ✅ Met à jour le statut du capteur en "offline"
- ✅ Enregistre la date de déconnexion

### Génération d'Alertes (automatique à chaque mesure)

Via `MesureObserver` :
- ✅ Détecte les dépassements de seuils (min/max)
- ✅ Crée des alertes non critiques (1ère occurrence)
- ✅ Passe les alertes en CRITIQUE (2ème occurrence consécutive)
- ✅ Résout automatiquement les alertes quand les valeurs reviennent normales
- ✅ Résout les alertes de déconnexion quand une mesure arrive

## 🧪 Tests

### Tester la commande manuellement

```bash
php artisan check:capteurs-connection
```

### Tester le scheduler

```bash
php artisan schedule:run
```

### Tester la génération d'alertes

```bash
php test_mesure_alerte.php
```

## 📊 Logs

Les logs du scheduler et des alertes sont dans :

```
storage/logs/laravel.log
```

Pour voir les dernières lignes :

```bash
# Windows PowerShell
Get-Content storage/logs/laravel.log -Tail 50

# Linux/Mac
tail -f storage/logs/laravel.log
```

## ⚙️ Configuration

### Modifier la fréquence de vérification

Éditer `app/Console/Kernel.php` :

```php
// Toutes les minutes
$schedule->command('check:capteurs-connection')->everyMinute();

// Toutes les 2 minutes (actuel)
$schedule->command('check:capteurs-connection')->everyTwoMinutes();

// Toutes les 5 minutes
$schedule->command('check:capteurs-connection')->everyFiveMinutes();

// Toutes les 10 minutes
$schedule->command('check:capteurs-connection')->everyTenMinutes();
```

### Modifier le timeout de déconnexion

Éditer `app/Console/Commands/CheckCapteursConnection.php` :

```php
$timeout = 300; // 5 minutes (actuel)
$timeout = 180; // 3 minutes
$timeout = 600; // 10 minutes
```

## 🔧 Dépannage

### Le scheduler ne s'exécute pas

1. Vérifier que PHP est dans le PATH :
   ```bash
   php --version
   ```

2. Vérifier les permissions sur `storage/` et `bootstrap/cache/` :
   ```bash
   chmod -R 775 storage bootstrap/cache
   ```

3. Vérifier les logs Laravel :
   ```bash
   tail -f storage/logs/laravel.log
   ```

### Les alertes ne se créent pas

1. Vérifier que le capteur a des seuils définis (`seuil_min` et `seuil_max`)
2. Vérifier que `MesureObserver` est enregistré dans `AppServiceProvider`
3. Regarder les logs pour voir les erreurs

## 📝 Architecture

```
Mesure créée
    ↓
MesureObserver (automatique)
    ↓
├─ Met à jour statut capteur → online
├─ Résout alertes déconnexion
├─ Vérifie seuils min/max
└─ Crée/Met à jour alertes de seuil

Scheduler Laravel (toutes les 2 min)
    ↓
CheckCapteursConnection
    ↓
├─ Vérifie date_derniere_connexion
├─ Si > 5 min → crée alerte déconnexion
└─ Met à jour statut capteur → offline
```

## 🎯 Production Checklist

- [ ] Installer la tâche planifiée Windows (`install-scheduler-windows.ps1`)
- [ ] Vérifier que la tâche s'exécute (`Get-ScheduledTask`)
- [ ] Tester manuellement la commande (`php artisan check:capteurs-connection`)
- [ ] Vérifier les logs (`storage/logs/laravel.log`)
- [ ] Configurer les seuils sur tous les capteurs
- [ ] Tester l'ajout d'une mesure hors seuil
- [ ] Vérifier que les alertes apparaissent dans le frontend

## 📚 Commandes Utiles

```bash
# Voir toutes les tâches planifiées
php artisan schedule:list

# Exécuter le scheduler manuellement
php artisan schedule:run

# Exécuter le scheduler en continu (développement)
php artisan schedule:work

# Vérifier manuellement les capteurs
php artisan check:capteurs-connection

# Voir les logs en temps réel
tail -f storage/logs/laravel.log
```

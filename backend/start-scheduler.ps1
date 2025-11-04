# Script pour démarrer le scheduler Laravel en continu (développement)
# Usage: .\start-scheduler.ps1

Write-Host "=== Démarrage du Laravel Scheduler ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ce script va exécuter les tâches planifiées automatiquement:" -ForegroundColor Yellow
Write-Host "  - Vérification des capteurs déconnectés (toutes les 2 minutes)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Red
Write-Host ""

$backendPath = "C:\Users\user\Desktop\clinic-monitoring\backend"

# Vérifier que le dossier existe
if (!(Test-Path $backendPath)) {
    Write-Host "Erreur: Le dossier backend n'existe pas!" -ForegroundColor Red
    exit 1
}

# Se déplacer dans le dossier backend
Set-Location $backendPath

# Boucle infinie qui exécute le scheduler toutes les minutes
while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Exécution du scheduler..." -ForegroundColor Gray
    
    # Exécuter le scheduler Laravel
    php artisan schedule:run
    
    # Attendre 60 secondes avant la prochaine exécution
    Start-Sleep -Seconds 60
}

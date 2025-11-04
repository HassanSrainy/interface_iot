# Script pour installer la tâche planifiée Windows
# ATTENTION: Exécuter en tant qu'Administrateur

Write-Host "=== Installation du Scheduler Laravel dans Windows ===" -ForegroundColor Green
Write-Host ""

$taskName = "Laravel_Scheduler_ClinicMonitoring"
$backendPath = "C:\Users\user\Desktop\clinic-monitoring\backend"
$phpPath = (Get-Command php).Source
$action = New-ScheduledTaskAction -Execute $phpPath -Argument "artisan schedule:run" -WorkingDirectory $backendPath

# Créer un déclencheur qui s'exécute toutes les minutes
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration ([TimeSpan]::MaxValue)

# Créer les paramètres de la tâche
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Créer l'utilisateur qui exécute la tâche (utilisateur actuel)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive

Write-Host "Configuration de la tâche:" -ForegroundColor Cyan
Write-Host "  Nom: $taskName"
Write-Host "  PHP: $phpPath"
Write-Host "  Backend: $backendPath"
Write-Host "  Fréquence: Toutes les minutes"
Write-Host ""

try {
    # Supprimer la tâche si elle existe déjà
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "Suppression de l'ancienne tâche..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    # Enregistrer la nouvelle tâche
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal

    Write-Host ""
    Write-Host "✅ Tâche planifiée installée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Le scheduler s'exécutera automatiquement toutes les minutes." -ForegroundColor Green
    Write-Host "La vérification des capteurs déconnectés se fera toutes les 2 minutes." -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour vérifier la tâche, ouvrez le Planificateur de tâches Windows" -ForegroundColor Cyan
    Write-Host "ou utilisez: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Pour désinstaller: Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor Yellow

} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'installation:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Assurez-vous d'exécuter ce script en tant qu'Administrateur!" -ForegroundColor Yellow
}

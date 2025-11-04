@echo off
title Laravel Scheduler - Clinic Monitoring
cd /d C:\Users\user\Desktop\clinic-monitoring\backend

echo ========================================
echo   Laravel Scheduler - Auto Check
echo ========================================
echo.
echo Demarrage du scheduler automatique...
echo Verification capteurs deconnectes: toutes les 2 minutes
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.

REM Utiliser schedule:work (disponible depuis Laravel 8+)
REM --quiet pour reduire les messages de log
php artisan schedule:work --quiet

pause

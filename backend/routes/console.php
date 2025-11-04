<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ============================================
// TÂCHE PLANIFIÉE : Vérification des capteurs
// ============================================
// Vérifie toutes les 2 minutes si des capteurs sont déconnectés
Schedule::command('check:capteurs-connection')
    ->everyTwoMinutes()
    ->withoutOverlapping()
    ->runInBackground();

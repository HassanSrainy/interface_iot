<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Les commandes artisan enregistrées
     *
     * @var array<int, class-string|string>
     */
    protected $commands = [
        // Enregistrer la commande que nous avons créée
        \App\Console\Commands\CheckCapteursConnection::class,
    ];

    /**
     * Définir le planning des commandes
     */
    protected function schedule(Schedule $schedule): void
    {
        // Vérifie toutes les 5 minutes pour détecter les déconnexions
        $schedule->command('check:capteurs-connection')->everyFiveMinutes();
    }

    /**
     * Enregistrer les commandes pour l'application
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

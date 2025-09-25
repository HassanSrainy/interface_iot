<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Capteur;
use App\Models\Alerte;
use Carbon\Carbon;

class CheckCapteursConnection extends Command
{
    protected $signature = 'check:capteurs-connection';
    protected $description = 'Vérifie les capteurs pour détecter les déconnexions et créer des alertes.';

    public function handle()
    {
        $timeout = 300; // 5 minutes
        $capteurs = Capteur::all();

        foreach ($capteurs as $capteur) {
            $last = $capteur->date_derniere_connexion;

            // Si dernier signal trop ancien ou jamais connecté
            if (!$last || Carbon::parse($last)->diffInSeconds(now()) > $timeout) {

                // Vérifier si une alerte de déconnexion active existe déjà
                $alerteExistante = Alerte::where('capteur_id', $capteur->id)
                    ->where('type', 'deconnexion')
                    ->where('statut', 'actif')
                    ->first();

                if (!$alerteExistante) {
                    // Créer une nouvelle alerte de déconnexion
                    Alerte::create([
                        'capteur_id' => $capteur->id,
                        'type' => 'deconnexion',
                        'valeur' => null,
                        'statut' => 'actif',
                        'date' => now(),
                    ]);

                    $this->info("Alerte déconnexion créée pour le capteur ID {$capteur->id}");
                }

                // Mettre à jour le capteur : statut offline + dernière déconnexion
                $capteur->status = 'offline';
                $capteur->date_derniere_deconnexion = now();
                $capteur->save();
            }
        }

        $this->info('Vérification des capteurs terminée.');
    }
}

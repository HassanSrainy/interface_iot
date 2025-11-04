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
        $timeout = 120; // 2 minutes
        $capteurs = Capteur::all();

        $this->info("Vérification de {$capteurs->count()} capteurs...");
        $this->info("Timeout: {$timeout} secondes (2 minutes)");

        foreach ($capteurs as $capteur) {
            $last = $capteur->date_derniere_connexion;

            $this->info("Capteur ID {$capteur->id} ({$capteur->matricule}):");
            $this->info("  - Dernière connexion: " . ($last ? $last : "jamais"));
            
            // Si dernier signal trop ancien ou jamais connecté
            if (!$last) {
                $this->warn("  - Jamais connecté -> Déconnexion");
                
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

                    $this->info("  ✅ Alerte déconnexion créée");
                } else {
                    $this->info("  ℹ️  Alerte déconnexion déjà existante");
                }

                // Mettre à jour le capteur : statut offline + dernière déconnexion
                $capteur->status = 'offline';
                $capteur->date_derniere_deconnexion = now();
                $capteur->save();
                
            } elseif (Carbon::parse($last)->diffInSeconds(now()) > $timeout) {
                $diffSeconds = Carbon::parse($last)->diffInSeconds(now());
                $this->warn("  - Déconnecté depuis {$diffSeconds}s (> {$timeout}s)");
                
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

                    $this->info("  ✅ Alerte déconnexion créée");
                } else {
                    $this->info("  ℹ️  Alerte déconnexion déjà existante");
                }

                // Mettre à jour le capteur : statut offline + dernière déconnexion
                $capteur->status = 'offline';
                $capteur->date_derniere_deconnexion = now();
                $capteur->save();
            } else {
                $diffSeconds = Carbon::parse($last)->diffInSeconds(now());
                $this->info("  ✅ Connecté (dernier signal il y a {$diffSeconds}s)");
            }
        }

        $this->info('Vérification des capteurs terminée.');
    }
}

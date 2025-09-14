<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Capteur;
use App\Models\Mesure;

class AlertesTableSeeder extends Seeder
{
    public function run(): void
    {
        $capteurs = Capteur::all();

        foreach ($capteurs as $capteur) {
            // 1️⃣ Vérifier déconnexion récente (ex: date_derniere_connexion > 24h)
            $derniere_connexion = $capteur->date_derniere_connexion;
            if (!$derniere_connexion || $derniere_connexion->diffInHours(now()) > 24) {
                DB::table('alertes')->insert([
                    'capteur_id' => $capteur->id,
                    'mesure_id' => null, // pas de mesure
                    'type' => 'deconnexion',
                    'valeur' => 0,
                    'date' => now(),
                    'statut' => 'non_lue',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 2️⃣ Vérifier mesures hors seuil
            $mesures = $capteur->mesures()->get();
            foreach ($mesures as $mesure) {
                if ($mesure->valeur < $capteur->seuil_min || $mesure->valeur > $capteur->seuil_max) {
                    $type = $mesure->valeur < $capteur->seuil_min ? 'low' : 'high';
                    DB::table('alertes')->insert([
                        'capteur_id' => $capteur->id,
                        'mesure_id' => $mesure->id,
                        'type' => $type,
                        'valeur' => $mesure->valeur,
                        'date' => $mesure->date_mesure,
                        'statut' => 'non_lue',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}

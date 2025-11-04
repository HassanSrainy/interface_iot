<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Capteur;
use App\Models\Mesure;
use Carbon\Carbon;

class AlertesTableSeeder extends Seeder
{
    public function run(): void
    {
        $capteurs = Capteur::all();

        foreach ($capteurs as $capteur) {
            // 1️⃣ Vérifier déconnexion récente (ex: date_derniere_connexion > 24h)
            $derniere_connexion = $capteur->date_derniere_connexion;
            if (!$derniere_connexion || $derniere_connexion->diffInHours(now()) > 24) {
                // Créer une alerte de déconnexion active
                DB::table('alertes')->insert([
                    'capteur_id' => $capteur->id,
                    'mesure_id' => null,
                    'type' => 'deconnexion',
                    'valeur' => 0,
                    'date' => now(),
                    'statut' => 'actif',
                    'critique' => false,
                    'date_resolution' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 2️⃣ Analyser les mesures pour créer des alertes de seuil intelligentes
            $mesures = $capteur->mesures()->orderBy('date_mesure', 'asc')->get();
            
            $alerteActive = null;
            $consecutiveHorsSeuil = 0;
            
            foreach ($mesures as $index => $mesure) {
                $isHorsSeuil = false;
                $type = null;
                
                // Vérifier si hors seuil
                if ($capteur->seuil_min !== null && $mesure->valeur < $capteur->seuil_min) {
                    $isHorsSeuil = true;
                    $type = 'lower';
                } elseif ($capteur->seuil_max !== null && $mesure->valeur > $capteur->seuil_max) {
                    $isHorsSeuil = true;
                    $type = 'high';
                }

                if ($isHorsSeuil) {
                    $consecutiveHorsSeuil++;
                    
                    if (!$alerteActive) {
                        // Première mesure hors seuil → créer alerte NON critique
                        $alerteActive = DB::table('alertes')->insertGetId([
                            'capteur_id' => $capteur->id,
                            'mesure_id' => $mesure->id,
                            'type' => $type,
                            'valeur' => $mesure->valeur,
                            'date' => $mesure->date_mesure,
                            'statut' => 'actif',
                            'critique' => false,
                            'date_resolution' => null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } elseif ($consecutiveHorsSeuil >= 2) {
                        // Deuxième mesure consécutive → passer à CRITIQUE
                        DB::table('alertes')
                            ->where('id', $alerteActive)
                            ->update([
                                'critique' => true,
                                'updated_at' => now(),
                            ]);
                    }
                } else {
                    // Mesure dans les seuils
                    if ($alerteActive) {
                        // Résoudre l'alerte active
                        DB::table('alertes')
                            ->where('id', $alerteActive)
                            ->update([
                                'statut' => 'inactif',
                                'date_resolution' => $mesure->date_mesure,
                                'updated_at' => now(),
                            ]);
                        
                        $alerteActive = null;
                        $consecutiveHorsSeuil = 0;
                    }
                }
            }
        }

        // 3️⃣ Créer des alertes résolues d'exemple (historique)
        $this->createSampleResolvedAlerts();
    }

    /**
     * Créer des alertes résolues pour avoir un historique
     */
    private function createSampleResolvedAlerts(): void
    {
        $capteurs = Capteur::take(5)->get();

        foreach ($capteurs as $capteur) {
            // Alerte résolue aujourd'hui
            DB::table('alertes')->insert([
                'capteur_id' => $capteur->id,
                'mesure_id' => null,
                'type' => 'high',
                'valeur' => $capteur->seuil_max ? $capteur->seuil_max + 5 : 100,
                'date' => Carbon::today()->subHours(3),
                'statut' => 'inactif',
                'critique' => true,
                'date_resolution' => Carbon::today()->subHours(1),
                'created_at' => Carbon::today()->subHours(3),
                'updated_at' => Carbon::today()->subHours(1),
            ]);

            // Alerte résolue il y a 3 jours
            DB::table('alertes')->insert([
                'capteur_id' => $capteur->id,
                'mesure_id' => null,
                'type' => 'lower',
                'valeur' => $capteur->seuil_min ? $capteur->seuil_min - 3 : 10,
                'date' => Carbon::today()->subDays(3)->subHours(5),
                'statut' => 'inactif',
                'critique' => false,
                'date_resolution' => Carbon::today()->subDays(3)->subHours(2),
                'created_at' => Carbon::today()->subDays(3)->subHours(5),
                'updated_at' => Carbon::today()->subDays(3)->subHours(2),
            ]);

            // Alerte résolue il y a 7 jours (déconnexion)
            DB::table('alertes')->insert([
                'capteur_id' => $capteur->id,
                'mesure_id' => null,
                'type' => 'deconnexion',
                'valeur' => 0,
                'date' => Carbon::today()->subDays(7)->subHours(12),
                'statut' => 'inactif',
                'critique' => false,
                'date_resolution' => Carbon::today()->subDays(7)->subHours(8),
                'created_at' => Carbon::today()->subDays(7)->subHours(12),
                'updated_at' => Carbon::today()->subDays(7)->subHours(8),
            ]);
        }
    }
}

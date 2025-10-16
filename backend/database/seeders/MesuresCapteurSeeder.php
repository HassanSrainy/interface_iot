<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MesuresCapteurSeeder extends Seeder
{
    public function run()
    {
        $startDate = Carbon::now()->subMonths(2); // Début : il y a 2 mois
        $endDate = Carbon::now(); // Fin : maintenant

        // Boucler sur les 20 capteurs
        for ($capteurId = 1; $capteurId <= 20; $capteurId++) {
            $currentDate = $startDate->copy();

            while ($currentDate->lte($endDate)) {
                DB::table('mesures')->insert([
                    'capteur_id' => $capteurId,
                    'valeur' => rand(10, 60), // Valeur aléatoire entre 10 et 60
                    'date_mesure' => $currentDate->toDateTimeString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Incrément d'une heure
                $currentDate->addHour();
            }

            $this->command->info("Mesures générées pour le capteur $capteurId ✅");
        }

        $this->command->info('✅ Génération terminée pour les 20 capteurs !');
    }
}

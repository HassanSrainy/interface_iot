<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MesuresCapteurSeeder extends Seeder
{
    public function run()
    {
        $capteurId = 4; // id du capteur
        $startDate = Carbon::now()->subMonths(2); // il y a 2 mois
        $endDate = Carbon::now();

        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            DB::table('mesures')->insert([
                'capteur_id' => $capteurId,
                'valeur' => rand(10, 60), // valeur aléatoire entre 10 et 60
                'date_mesure' => $currentDate->toDateTimeString(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Incrémenter la date d'1 heure pour avoir des mesures horaires
            $currentDate->addHour();
        }
    }
}

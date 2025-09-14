<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Capteur;
use Carbon\Carbon;

class MesuresTableSeeder extends Seeder
{
    public function run(): void
    {
        // Récupérer tous les capteurs avec leur famille et type
        $capteurs = Capteur::with('famille.type')->get();

        foreach ($capteurs as $capteur) {
            // Vérifier que la famille et le type existent
            if (!$capteur->famille || !$capteur->famille->type) {
                continue; // ignorer ce capteur
            }

            $typeCapteur = $capteur->famille->type->type;

            for ($i = 0; $i < 5; $i++) { // 5 mesures par capteur
                $now = Carbon::now()->subMinutes(rand(0, 1000));

                // Générer la valeur selon le type
                $valeur = match($typeCapteur) {
                    'Température' => rand(18, 28) + rand(0, 9)/10,
                    'Humidité'     => rand(30, 70) + rand(0, 9)/10,
                    'Tension'      => rand(110, 240) + rand(0, 9)/10,
                    'CO2'          => rand(300, 1000), // ppm
                    default        => 0,
                };

                DB::table('mesures')->insert([
                    'capteur_id'   => $capteur->id,
                    'valeur'       => $valeur,
                    'date_mesure'  => $now,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ]);
            }
        }
    }
}

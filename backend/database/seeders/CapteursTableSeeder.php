<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use App\Models\Service;
use App\Models\Famille;

class CapteursTableSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $services = Service::pluck('id')->toArray(); // tous les IDs de services
        $familles = Famille::all();                  // récupérer toutes les familles

        $counters = []; // pour générer un matricule unique par famille

        for ($i = 0; $i < 20; $i++) {
            $famille = $familles->random();
            $familleName = $famille->famille;
            $prefix = strtoupper(substr($familleName, 0, 1));

            if (!isset($counters[$famille->id])) {
                $counters[$famille->id] = 1;
            }

            // matricule unique basé sur la lettre + id famille + compteur
            $matricule = $prefix . $famille->id . str_pad($counters[$famille->id], 2, '0', STR_PAD_LEFT);
            $counters[$famille->id]++;

            DB::table('capteurs')->insert([
                'service_id' => $faker->randomElement($services),
                'famille_id' => $famille->id,
                'matricule' => $matricule,
                'date_installation' => $faker->date(),
                'date_derniere_connexion' => $faker->dateTimeThisYear(),
                'date_derniere_deconnexion' => $faker->dateTimeThisYear(),
                'seuil_min' => match($familleName) {
                    'Température' => rand(18, 22),
                    'Humidité'    => rand(30, 50),
                    'Tension'     => rand(110, 200),
                    'CO2'         => rand(300, 500),
                    default       => rand(10, 50)
                },
                'seuil_max' => match($familleName) {
                    'Température' => rand(23, 28),
                    'Humidité'    => rand(51, 70),
                    'Tension'     => rand(210, 240),
                    'CO2'         => rand(600, 800),
                    default       => rand(60, 100)
                },
                'unite' => match($familleName) {
                    'Température' => 'celsius',
                    'Humidité'    => 'percent',
                    'Tension'     => 'volt',
                    'CO2'         => 'ppm',
                    default       => $faker->randomElement(['celsius', 'percent', 'bar', 'lux', 'watt'])
                },
                'adresse_ip'  => $faker->ipv4,
                'adresse_mac' => $faker->macAddress, // ✅ ajout
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
    }
}

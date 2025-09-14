<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Clinique;
use Faker\Factory as Faker;

class CliniquesTableSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 0; $i < 5; $i++) {
            Clinique::create([
                'nom' => 'Clinique ' . $faker->company,
                'adresse' => $faker->address,
            ]);
        }
    }
}

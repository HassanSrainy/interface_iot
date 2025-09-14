<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypesTableSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['Température', 'Humidité', 'Tension', 'CO2'];

        foreach ($types as $type) {
            DB::table('types')->insert([
                'type' => $type,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}

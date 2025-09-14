<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Type;

class FamillesTableSeeder extends Seeder
{
    public function run(): void
    {
        $famillesData = [
            'Température' => ['Thermique', 'Ambiante'],
            'Humidité' => ['Relative', 'Absolue'],
            'Tension' => ['Basse', 'Moyenne', 'Haute'],
            'CO2' => ['Indoor', 'Outdoor'],
        ];

        foreach ($famillesData as $typeName => $familles) {
            $type = Type::where('type', $typeName)->first();

            foreach ($familles as $famille) {
                DB::table('familles')->insert([
                    'type_id' => $type->id,
                    'famille' => $famille,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}

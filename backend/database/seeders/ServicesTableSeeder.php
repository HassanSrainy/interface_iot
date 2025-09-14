<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Floor;

class ServicesTableSeeder extends Seeder
{
    public function run(): void
    {
        $serviceNames = ['Kitchen', 'Office', 'Laboratory', 'Ward'];

        $floors = Floor::pluck('id')->toArray();

        foreach ($floors as $floor_id) {
            foreach ($serviceNames as $name) {
                DB::table('services')->insert([
                    'floor_id' => $floor_id,
                    'nom' => $name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}

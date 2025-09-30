<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Clinique;

class FloorsTableSeeder extends Seeder
{
    public function run(): void
    {
        // Définitions typiques — nom + niveau
        $floorsTemplate = [
            ['nom' => 'Ground Floor', 'niveau' => 0],
            ['nom' => 'First Floor',  'niveau' => 1],
            ['nom' => 'Second Floor', 'niveau' => 2],
        ];

        $cliniques = Clinique::pluck('id')->toArray();

        foreach ($cliniques as $clinique_id) {
            foreach ($floorsTemplate as $f) {
                DB::table('floors')->insert([
                    'clinique_id' => $clinique_id,
                    'nom'         => $f['nom'],
                    'niveau'      => $f['niveau'],
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Clinique;

class FloorsTableSeeder extends Seeder
{
    public function run(): void
    {
        $floorsNames = ['Ground Floor', 'First Floor', 'Second Floor'];
        $cliniques = Clinique::pluck('id')->toArray();

        foreach ($cliniques as $clinique_id) {
            foreach ($floorsNames as $name) {
                DB::table('floors')->insert([
                    'clinique_id' => $clinique_id,
                    'nom' => $name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}

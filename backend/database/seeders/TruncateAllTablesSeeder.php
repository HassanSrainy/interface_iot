<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TruncateAllTablesSeeder extends Seeder
{
    public function run(): void
    {
        // Désactiver temporairement les contraintes de clés étrangères
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Vider toutes les tables
        DB::table('alertes')->truncate();
        DB::table('mesures')->truncate();
        DB::table('capteurs')->truncate();
        //DB::table('services')->truncate();
        //DB::table('floors')->truncate();
        //DB::table('cliniques')->truncate();
        //DB::table('familles')->truncate();
        //DB::table('types')->truncate();
        //DB::table('users')->truncate();
        //DB::table('clinique_user')->truncate();

        // Réactiver les contraintes de clés étrangères
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('Toutes les tables ont été vidées et les IDs réinitialisés.');
    }
}

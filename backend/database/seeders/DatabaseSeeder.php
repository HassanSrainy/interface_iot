<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Appeler tous les seeders dans le bon ordre
        $this->call([
            TypesTableSeeder::class,      // 1️⃣ Types
            FamillesTableSeeder::class,   // 2️⃣ Familles
            CliniquesTableSeeder::class,  // 3️⃣ Cliniques
            FloorsTableSeeder::class,     // 4️⃣ Floors
            ServicesTableSeeder::class,   // 5️⃣ Services
            CapteursTableSeeder::class,   // 6️⃣ Capteurs
            MesuresTableSeeder::class,    // 7️⃣ Mesures
            AlertesTableSeeder::class,    // 8️⃣ Alertes    
            UsersTableSeeder::class,     
        ]);
    }
}

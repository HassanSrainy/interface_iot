<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1️⃣ Créer des utilisateurs
        DB::table('users')->insert([
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'User1',
                'email' => 'user1@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'User2',
                'email' => 'user2@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 2️⃣ Lier les utilisateurs à des cliniques (table pivot)
        DB::table('clinique_user')->insert([
            ['user_id' => 1, 'clinique_id' => 1, 'role' => 'admin', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => 1, 'clinique_id' => 2, 'role' => 'admin', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => 2, 'clinique_id' => 1, 'role' => 'user', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => 3, 'clinique_id' => 2, 'role' => 'user', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}

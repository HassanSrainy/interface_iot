<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinique_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('clinique_id')->constrained('cliniques')->onDelete('cascade');
            
            // Champ supplémentaire (optionnel)
            $table->string('role')->default('user'); 

            $table->timestamps();

            // Pour éviter les doublons user-clinique
            $table->unique(['user_id', 'clinique_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinique_user');
    }
};

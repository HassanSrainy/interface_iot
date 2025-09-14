<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capteurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('famille_id')->constrained('familles')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->string('matricule')->unique();
            $table->date('date_installation')->nullable();
            $table->timestamp('date_derniere_connexion')->nullable();
            $table->timestamp('date_derniere_deconnexion')->nullable();
            $table->float('seuil_min')->nullable();
            $table->float('seuil_max')->nullable();
            $table->string('adresse_ip')->nullable();
            $table->string('adresse_mac')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capteurs');
    }
};

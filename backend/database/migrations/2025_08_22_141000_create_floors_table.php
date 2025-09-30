<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('floors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clinique_id')->constrained('cliniques')->onDelete('cascade');
            $table->string('nom');           // libellé visible (ex: "Ground Floor", "Rez-de-chaussée")
            $table->integer('niveau');       // numéro d'étage (ex: 0 = Rez, 1 = 1er)
            $table->timestamps();

            // Unicité : pas deux mêmes noms pour une même clinique
            $table->unique(['clinique_id', 'nom'], 'floors_clinique_nom_unique');

            // Unicité : pas deux étages ayant le même niveau dans la même clinique
            $table->unique(['clinique_id', 'niveau'], 'floors_clinique_niveau_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('floors');
    }
};

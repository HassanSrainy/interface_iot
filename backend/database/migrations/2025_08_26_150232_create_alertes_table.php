<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('capteur_id')->constrained('capteurs')->onDelete('cascade');
            $table->foreignId('mesure_id')->nullable()->constrained('mesures')->onDelete('cascade');
            $table->string('type'); // high, low, panne
            $table->float('valeur')->nullable();
            $table->timestamp('date')->useCurrent();
            $table->string('statut')->default('actif'); // non_lue, lue
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertes');
    }
};

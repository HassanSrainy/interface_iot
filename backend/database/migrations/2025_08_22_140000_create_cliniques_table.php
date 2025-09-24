<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cliniques', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('adresse')->nullable();
            $table->string('ville')->nullable(); // ✅ ajouté ici
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cliniques');
    }
};

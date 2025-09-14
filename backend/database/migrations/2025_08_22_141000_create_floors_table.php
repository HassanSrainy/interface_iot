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
            $table->string('nom'); 
            $table->timestamps();
            $table->unique(['clinique_id', 'nom']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('floors');
    }
};

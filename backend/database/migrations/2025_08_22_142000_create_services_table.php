<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('floor_id')->constrained('floors')->onDelete('cascade');
            $table->string('nom'); // ex: Kitchen, Office_BM
            $table->timestamps();
            $table->unique(['floor_id', 'nom']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};

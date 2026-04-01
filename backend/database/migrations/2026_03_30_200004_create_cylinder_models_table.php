<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla maestra de modelos/marcas de cilindros
        // Ej: JD, KIOSHI, PRAXAIR, LUXFER
        Schema::create('cylinder_models', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique(); // Ej: JD, KIOSHI, LUXFER
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cylinder_models');
    }
};

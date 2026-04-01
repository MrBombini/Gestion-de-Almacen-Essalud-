<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla maestra de capacidades oficiales de cilindros
        // Debe crearse ANTES que la tabla cylinders (FK: capacity_id)
        Schema::create('cylinder_capacities', function (Blueprint $table) {
            $table->id();
            $table->decimal('value', 10, 2)->unique(); // Ej: 1.00, 6.00, 10.00
            $table->string('unit', 10)->default('m3'); // m3 o kg
            $table->string('description', 100)->nullable(); // Ej: Balón pequeño
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cylinder_capacities');
    }
};

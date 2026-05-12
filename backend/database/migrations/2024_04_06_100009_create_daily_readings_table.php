<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_readings', function (Blueprint $table) {
            $table->id();
            $table->date('reading_date');
            $table->string('shift', 20); // Morning, Afternoon, Night
            $table->decimal('tank_level', 10, 2); // Nivel del Tanque (%)
            $table->decimal('flow_meter_reading', 10, 2); // Lectura del Flujómetro (m3)
            $table->decimal('calculated_consumption', 10, 2)->nullable(); // Consumo entre turnos
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_readings');
    }
};

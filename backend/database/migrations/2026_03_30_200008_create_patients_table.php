<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_code', 20)->unique(); // Cod. Pa (Ej: 823, 2766) — columna amarilla
            $table->string('name', 200);
            $table->string('dni', 20)->unique();
            $table->date('birth_date')->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();

            // Control de Préstamo PADOMI (semáforo de días)
            $table->date('loan_expiration_date')->nullable();

            $table->unsignedBigInteger('location_id')->nullable();
            $table->foreign('location_id')->references('id')->on('locations')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes(); // Paciente dado de alta → historial de balones intacto
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};

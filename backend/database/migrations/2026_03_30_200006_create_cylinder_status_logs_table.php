<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Historial de cambios de estado de cada balón
        // Cada vez que el estado en 'cylinders' cambia, aquí queda la traza
        Schema::create('cylinder_status_logs', function (Blueprint $table) {
            $table->id();

            $table->string('cylinder_barcode', 50);
            $table->foreign('cylinder_barcode')->references('barcode')->on('cylinders');

            $table->enum('previous_status', ['Full', 'Empty', 'In Maintenance', 'Damaged', 'Retired'])->nullable();
            $table->enum('new_status', ['Full', 'Empty', 'In Maintenance', 'Damaged', 'Retired']);

            // Quién hizo el cambio
            $table->foreignId('user_id')->constrained('users');

            $table->text('notes')->nullable(); // Motivo del cambio (opcional)
            $table->timestamp('created_at')->useCurrent(); // Solo se crea, nunca se edita
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cylinder_status_logs');
    }
};
